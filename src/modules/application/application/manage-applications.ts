import { ApplicationRepository } from '../infrastructure/application-repository';
import { AuditWriter } from '../../audit/audit-writer';
import { AuditEventInput } from '../../audit/audit-writer';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  SearchApplicationsInput,
  ApplicationResponse,
  ApplicationHistoryRecord,
  ApplicationDocumentResponse,
  SubmitApplicationInput,
  RequestInformationInput,
  ApproveApplicationInput,
  RejectApplicationInput,
  DocumentUploadInput,
  ApplicationStatus,
} from '../contracts/application';
import {
  ApplicationNotFoundError,
  ApplicationModificationNotAllowedError,
  ApplicationSubmissionValidationError,
  ApplicationDecisionNotAllowedError,
  ApplicationTerminalStateError,
  InvalidApplicationWindowError,
  ProgrammeNotAcceptingApplicationsError,
  SessionNotOpenForApplicationsError,
  StudentProfileIncompleteError,
  RequiredDocumentsMissingError,
} from '../domain/application';
import {
  validateStatusTransition,
  validateModification,
  canSubmitApplication,
  canRequestInformation,
  validateDecision,
  validateTerminalState,
  getStatusTransitionReason,
} from '../domain/application-status-transitions';

export class ManageApplications {
  constructor(
    private readonly repository: ApplicationRepository,
    private readonly auditWriter: AuditWriter,
  ) {}

  async createApplication(input: CreateApplicationInput): Promise<ApplicationResponse> {
    const application = await this.repository.create(input);

    await this.auditWriter.append({
      eventName: 'application.created',
      category: 'application',
      actor: { id: input.createdBy, type: 'user' },
      target: { type: 'application', id: application.id },
      action: 'create',
      outcome: 'success',
      correlationId: application.id,
      module: 'application',
      boundary: 'application',
      metadata: {
        studentId: input.studentId,
        programmeId: input.programmeId,
        sessionId: input.sessionId,
      },
    });

    return this.repository.toResponse(application);
  }

  async getApplication(id: string): Promise<ApplicationResponse> {
    const application = await this.repository.findById(id);
    if (!application) {
      throw new ApplicationNotFoundError(id);
    }

    return this.repository.toResponse(application);
  }

  async searchApplications(params: SearchApplicationsInput): Promise<ApplicationResponse[]> {
    const applications = await this.repository.search(params);
    return Promise.all(applications.map((app) => this.repository.toResponse(app)));
  }

  async updateApplication(id: string, input: UpdateApplicationInput): Promise<ApplicationResponse> {
    const application = await this.repository.findById(id);
    if (!application) {
      throw new ApplicationNotFoundError(id);
    }

    validateModification(application.status as ApplicationStatus);

    const updated = await this.repository.update(id, input);

    await this.auditWriter.append({
      eventName: 'application.updated',
      category: 'application',
      actor: { id: input.updatedBy, type: 'user' },
      target: { type: 'application', id },
      action: 'update',
      outcome: 'success',
      correlationId: id,
      module: 'application',
      boundary: 'application',
      beforeState: {
        personalStatement: application.personalStatement,
        academicHistory: application.academicHistory,
      },
      afterState: {
        personalStatement: updated.personalStatement,
        academicHistory: updated.academicHistory,
      },
    });

    return this.repository.toResponse(updated);
  }

  async submitApplication(id: string, input: SubmitApplicationInput): Promise<ApplicationResponse> {
    const application = await this.repository.findById(id);
    if (!application) {
      throw new ApplicationNotFoundError(id);
    }

    if (!canSubmitApplication(application.status as ApplicationStatus)) {
      throw new ApplicationSubmissionValidationError('Application is not in DRAFT status');
    }

    // TODO: Add validation for:
    // - Student profile completeness
    // - Programme acceptance status
    // - Session application window
    // - Required documents

    const submittedAt = new Date();
    await this.repository.setSubmittedAt(id, submittedAt);

    const targetStatus = ApplicationStatus.SUBMITTED;
    validateStatusTransition(application.status as ApplicationStatus, targetStatus);

    const reason = getStatusTransitionReason(
      application.status as ApplicationStatus,
      targetStatus,
    );

    const updated = await this.repository.updateStatus(
      id,
      targetStatus,
      input.submittedBy,
      reason,
    );

    await this.auditWriter.append({
      eventName: 'application.submitted',
      category: 'application',
      actor: { id: input.submittedBy, type: 'user' },
      target: { type: 'application', id },
      action: 'submit',
      outcome: 'success',
      correlationId: id,
      module: 'application',
      boundary: 'application',
      beforeState: { status: application.status },
      afterState: { status: updated.status, submittedAt },
    });

    return this.repository.toResponse(updated);
  }

  async requestInformation(
    id: string,
    input: RequestInformationInput,
  ): Promise<ApplicationResponse> {
    const application = await this.repository.findById(id);
    if (!application) {
      throw new ApplicationNotFoundError(id);
    }

    if (!canRequestInformation(application.status as ApplicationStatus)) {
      throw new ApplicationSubmissionValidationError(
        'Information cannot be requested in current status',
      );
    }

    const targetStatus = ApplicationStatus.INFORMATION_REQUESTED;
    validateStatusTransition(application.status as ApplicationStatus, targetStatus);

    const reason = `Information requested: ${input.reason}`;

    const updated = await this.repository.updateStatus(
      id,
      targetStatus,
      input.requestedBy,
      reason,
    );

    await this.auditWriter.append({
      eventName: 'application.information_requested',
      category: 'application',
      actor: { id: input.requestedBy, type: 'user' },
      target: { type: 'application', id },
      action: 'request_information',
      outcome: 'success',
      correlationId: id,
      module: 'application',
      boundary: 'application',
      beforeState: { status: application.status },
      afterState: { status: updated.status },
      metadata: { reason: input.reason },
    });

    return this.repository.toResponse(updated);
  }

  async approveApplication(id: string, input: ApproveApplicationInput): Promise<ApplicationResponse> {
    const application = await this.repository.findById(id);
    if (!application) {
      throw new ApplicationNotFoundError(id);
    }

    validateDecision(application.status as ApplicationStatus);

    const targetStatus = ApplicationStatus.APPROVED;
    validateStatusTransition(application.status as ApplicationStatus, targetStatus);

    const reason = `Application approved: ${input.reason}`;
    const decisionDate = new Date();

    await this.repository.setDecision(id, decisionDate, input.reason, input.approvedBy);

    const updated = await this.repository.updateStatus(
      id,
      targetStatus,
      input.approvedBy,
      reason,
    );

    await this.auditWriter.append({
      eventName: 'application.approved',
      category: 'application',
      actor: { id: input.approvedBy, type: 'user' },
      target: { type: 'application', id },
      action: 'approve',
      outcome: 'success',
      correlationId: id,
      module: 'application',
      boundary: 'application',
      beforeState: { status: application.status },
      afterState: { status: updated.status, decisionDate, decisionReason: input.reason },
      metadata: { reason: input.reason },
    });

    return this.repository.toResponse(updated);
  }

  async rejectApplication(id: string, input: RejectApplicationInput): Promise<ApplicationResponse> {
    const application = await this.repository.findById(id);
    if (!application) {
      throw new ApplicationNotFoundError(id);
    }

    validateDecision(application.status as ApplicationStatus);

    const targetStatus = ApplicationStatus.REJECTED;
    validateStatusTransition(application.status as ApplicationStatus, targetStatus);

    const reason = `Application rejected: ${input.reason}`;
    const decisionDate = new Date();

    await this.repository.setDecision(id, decisionDate, input.reason, input.rejectedBy);

    const updated = await this.repository.updateStatus(
      id,
      targetStatus,
      input.rejectedBy,
      reason,
    );

    await this.auditWriter.append({
      eventName: 'application.rejected',
      category: 'application',
      actor: { id: input.rejectedBy, type: 'user' },
      target: { type: 'application', id },
      action: 'reject',
      outcome: 'success',
      correlationId: id,
      module: 'application',
      boundary: 'application',
      beforeState: { status: application.status },
      afterState: { status: updated.status, decisionDate, decisionReason: input.reason },
      metadata: { reason: input.reason },
    });

    return this.repository.toResponse(updated);
  }

  async uploadDocument(
    applicationId: string,
    input: DocumentUploadInput,
  ): Promise<ApplicationDocumentResponse> {
    const application = await this.repository.findById(applicationId);
    if (!application) {
      throw new ApplicationNotFoundError(applicationId);
    }

    validateModification(application.status as ApplicationStatus);

    const document = await this.repository.uploadDocument(applicationId, input);

    await this.auditWriter.append({
      eventName: 'application.document_uploaded',
      category: 'application',
      actor: { id: input.uploadedBy, type: 'user' },
      target: { type: 'application', id: applicationId },
      action: 'upload_document',
      outcome: 'success',
      correlationId: document.id,
      module: 'application',
      boundary: 'application',
      metadata: {
        documentType: input.documentType,
        fileName: input.fileName,
        fileSize: input.fileSize,
      },
    });

    return this.repository.toDocumentResponse(document);
  }

  async getDocuments(applicationId: string): Promise<ApplicationDocumentResponse[]> {
    const application = await this.repository.findById(applicationId);
    if (!application) {
      throw new ApplicationNotFoundError(applicationId);
    }

    const documents = await this.repository.getDocuments(applicationId);
    return Promise.all(documents.map((doc) => this.repository.toDocumentResponse(doc)));
  }

  async getHistory(applicationId: string): Promise<ApplicationHistoryRecord[]> {
    const application = await this.repository.findById(applicationId);
    if (!application) {
      throw new ApplicationNotFoundError(applicationId);
    }

    const history = await this.repository.getHistory(applicationId);
    return Promise.all(history.map((h) => this.repository.toHistoryRecord(h)));
  }
}
