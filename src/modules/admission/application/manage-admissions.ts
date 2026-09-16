import { AdmissionRepository } from '../infrastructure/admission-repository';
import { AuditWriter, AuditEventInput } from '../../audit/audit-writer';
import {
  CreateAdmissionInput,
  SearchAdmissionsInput,
  AdmissionResponse,
  AdmissionHistoryRecord,
  AcceptAdmissionInput,
  DeferAdmissionInput,
  DeclineAdmissionInput,
  AdmissionStatus,
  AdmissionLetterResponse,
} from '../contracts/admission';
import {
  AdmissionNotFoundError,
  AdmissionActionNotAllowedError,
  AdmissionDeadlineExpiredError,
  AdmissionAlreadyExistsError,
  ApplicationNotApprovedError,
  DeferralNotAllowedError,
  AdmissionTerminalStateError,
} from '../domain/admission';
import {
  validateStatusTransition,
  validateAcceptance,
  validateDeferral,
  validateDecline,
  validateTerminalState,
  getStatusTransitionReason,
} from '../domain/admission-status-transitions';

export class ManageAdmissions {
  constructor(
    private readonly repository: AdmissionRepository,
    private readonly auditWriter: AuditWriter,
  ) {}

  async createAdmission(input: CreateAdmissionInput): Promise<AdmissionResponse> {
    // Check if admission already exists for this application
    const existingAdmission = await this.repository.findByApplicationId(input.applicationId);
    if (existingAdmission) {
      throw new AdmissionAlreadyExistsError(input.applicationId);
    }

    // TODO: Validate that application is in APPROVED status
    // TODO: Validate that student is valid and active
    // TODO: Validate that programme is published
    // TODO: Validate that session is open

    const admission = await this.repository.create(input);

    // Generate admission letter
    const letter = this.generateAdmissionLetter(admission);
    const updatedAdmission = await this.repository.setAdmissionLetter(admission.id, letter, new Date(), input.createdBy);

    await this.auditWriter.append({
      eventName: 'admission.created',
      category: 'admission',
      actor: { id: input.createdBy, type: 'user' },
      target: { type: 'admission', id: admission.id },
      action: 'create',
      outcome: 'success',
      correlationId: admission.id,
      module: 'admission',
      boundary: 'admission',
      metadata: {
        applicationId: input.applicationId,
        studentId: input.studentId,
        programmeId: input.programmeId,
        sessionId: input.sessionId,
      },
    });

    return this.repository.toResponse(updatedAdmission);
  }

  async getAdmission(id: string): Promise<AdmissionResponse> {
    const admission = await this.repository.findById(id);
    if (!admission) {
      throw new AdmissionNotFoundError(id);
    }

    return this.repository.toResponse(admission);
  }

  async searchAdmissions(params: SearchAdmissionsInput): Promise<AdmissionResponse[]> {
    const admissions = await this.repository.search(params);
    return Promise.all(admissions.map((adm) => this.repository.toResponse(adm)));
  }

  async acceptAdmission(id: string, input: AcceptAdmissionInput): Promise<AdmissionResponse> {
    const admission = await this.repository.findById(id);
    if (!admission) {
      throw new AdmissionNotFoundError(id);
    }

    validateAcceptance(admission.status as AdmissionStatus);

    // Check if deadline has expired
    if (new Date() > admission.acceptanceDeadline) {
      throw new AdmissionDeadlineExpiredError(id);
    }

    const targetStatus = AdmissionStatus.ACCEPTED;
    validateStatusTransition(admission.status as AdmissionStatus, targetStatus);

    const reason = getStatusTransitionReason(
      admission.status as AdmissionStatus,
      targetStatus,
    );

    const acceptedAt = new Date();
    await this.repository.setAcceptedAt(id, acceptedAt);

    const updated = await this.repository.updateStatus(
      id,
      targetStatus,
      input.acceptedBy,
      reason,
    );

    await this.auditWriter.append({
      eventName: 'admission.accepted',
      category: 'admission',
      actor: { id: input.acceptedBy, type: 'user' },
      target: { type: 'admission', id },
      action: 'accept',
      outcome: 'success',
      correlationId: id,
      module: 'admission',
      boundary: 'admission',
      beforeState: { status: admission.status },
      afterState: { status: updated.status, acceptedAt },
    });

    return this.repository.toResponse(updated);
  }

  async deferAdmission(id: string, input: DeferAdmissionInput): Promise<AdmissionResponse> {
    const admission = await this.repository.findById(id);
    if (!admission) {
      throw new AdmissionNotFoundError(id);
    }

    validateDeferral(admission.status as AdmissionStatus);

    // Check if deadline has expired
    if (new Date() > admission.acceptanceDeadline) {
      throw new AdmissionDeadlineExpiredError(id);
    }

    // Validate deferral end date
    if (input.deferralEndDate <= new Date()) {
      throw new DeferralNotAllowedError('Deferral end date must be in the future');
    }

    const targetStatus = AdmissionStatus.DEFERRED;
    validateStatusTransition(admission.status as AdmissionStatus, targetStatus);

    const reason = getStatusTransitionReason(
      admission.status as AdmissionStatus,
      targetStatus,
    );

    const deferredAt = new Date();
    await this.repository.setDeferred(id, deferredAt, input.deferralEndDate, input.deferredBy);

    const updated = await this.repository.updateStatus(
      id,
      targetStatus,
      input.deferredBy,
      reason,
    );

    await this.auditWriter.append({
      eventName: 'admission.deferred',
      category: 'admission',
      actor: { id: input.deferredBy, type: 'user' },
      target: { type: 'admission', id },
      action: 'defer',
      outcome: 'success',
      correlationId: id,
      module: 'admission',
      boundary: 'admission',
      beforeState: { status: admission.status },
      afterState: { status: updated.status, deferredAt, deferralEndDate: input.deferralEndDate },
      metadata: { deferralEndDate: input.deferralEndDate },
    });

    return this.repository.toResponse(updated);
  }

  async declineAdmission(id: string, input: DeclineAdmissionInput): Promise<AdmissionResponse> {
    const admission = await this.repository.findById(id);
    if (!admission) {
      throw new AdmissionNotFoundError(id);
    }

    validateDecline(admission.status as AdmissionStatus);

    const targetStatus = AdmissionStatus.DECLINED;
    validateStatusTransition(admission.status as AdmissionStatus, targetStatus);

    const reason = getStatusTransitionReason(
      admission.status as AdmissionStatus,
      targetStatus,
    );

    const declinedAt = new Date();
    await this.repository.setDeclinedAt(id, declinedAt, input.declinedBy);

    const updated = await this.repository.updateStatus(
      id,
      targetStatus,
      input.declinedBy,
      reason,
    );

    await this.auditWriter.append({
      eventName: 'admission.declined',
      category: 'admission',
      actor: { id: input.declinedBy, type: 'user' },
      target: { type: 'admission', id },
      action: 'decline',
      outcome: 'success',
      correlationId: id,
      module: 'admission',
      boundary: 'admission',
      beforeState: { status: admission.status },
      afterState: { status: updated.status, declinedAt },
    });

    return this.repository.toResponse(updated);
  }

  async getHistory(admissionId: string): Promise<AdmissionHistoryRecord[]> {
    const admission = await this.repository.findById(admissionId);
    if (!admission) {
      throw new AdmissionNotFoundError(admissionId);
    }

    const history = await this.repository.getHistory(admissionId);
    return Promise.all(history.map((h) => this.repository.toHistoryRecord(h)));
  }

  async getAdmissionLetter(id: string): Promise<AdmissionLetterResponse> {
    const admission = await this.repository.findById(id);
    if (!admission) {
      throw new AdmissionNotFoundError(id);
    }

    if (!admission.admissionLetter || !admission.letterGeneratedAt) {
      throw new Error('Admission letter not generated');
    }

    return {
      letter: admission.admissionLetter,
      generatedAt: admission.letterGeneratedAt,
    };
  }

  private generateAdmissionLetter(admission: Admission): string {
    // TODO: Implement proper letter generation with templates
    return `Admission Letter\n\nDear Student,\n\nCongratulations! You have been offered admission to the programme.\n\nOffer Date: ${admission.offerDate.toISOString()}\nAcceptance Deadline: ${admission.acceptanceDeadline.toISOString()}\n\nPlease accept this offer by the deadline to secure your place.\n\nBest regards,\nAdmissions Office`;
  }
}
