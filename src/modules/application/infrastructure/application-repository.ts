import { PrismaClient } from '@prisma/client';
import {
  Application,
  ApplicationHistory,
  ApplicationDocument,
  Prisma,
} from '@prisma/client';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  SearchApplicationsInput,
  ApplicationResponse,
  ApplicationHistoryRecord,
  ApplicationDocumentResponse,
  DocumentUploadInput,
} from '../contracts/application';
import { ApplicationStatus } from '../contracts/application';

export class ApplicationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateApplicationInput): Promise<Application> {
    return this.prisma.application.create({
      data: {
        studentId: input.studentId,
        programmeId: input.programmeId,
        sessionId: input.sessionId,
        personalStatement: input.personalStatement,
        academicHistory: input.academicHistory,
        status: ApplicationStatus.DRAFT,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
        statusChangedBy: input.createdBy,
        statusChangeReason: 'Application created',
      },
    });
  }

  async findById(id: string): Promise<Application | null> {
    return this.prisma.application.findUnique({
      where: { id },
    });
  }

  async search(params: SearchApplicationsInput): Promise<Application[]> {
    const where: Prisma.ApplicationWhereInput = {};

    if (params.studentId) {
      where.studentId = params.studentId;
    }

    if (params.programmeId) {
      where.programmeId = params.programmeId;
    }

    if (params.sessionId) {
      where.sessionId = params.sessionId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.submittedAfter || params.submittedBefore) {
      where.submittedAt = {};
      if (params.submittedAfter) {
        where.submittedAt.gte = params.submittedAfter;
      }
      if (params.submittedBefore) {
        where.submittedAt.lte = params.submittedBefore;
      }
    }

    if (params.decidedAfter || params.decidedBefore) {
      where.decisionDate = {};
      if (params.decidedAfter) {
        where.decisionDate.gte = params.decidedAfter;
      }
      if (params.decidedBefore) {
        where.decisionDate.lte = params.decidedBefore;
      }
    }

    return this.prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateApplicationInput): Promise<Application> {
    return this.prisma.application.update({
      where: { id },
      data: {
        personalStatement: input.personalStatement,
        academicHistory: input.academicHistory,
        updatedBy: input.updatedBy,
      },
    });
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    changedBy: string,
    reason: string,
  ): Promise<Application> {
    return this.prisma.application.update({
      where: { id },
      data: {
        status,
        statusChangedAt: new Date(),
        statusChangedBy: changedBy,
        statusChangeReason: reason,
        updatedBy: changedBy,
      },
    });
  }

  async setSubmittedAt(id: string, submittedAt: Date): Promise<Application> {
    return this.prisma.application.update({
      where: { id },
      data: { submittedAt },
    });
  }

  async setDecision(
    id: string,
    decisionDate: Date,
    decisionReason: string,
    updatedBy: string,
  ): Promise<Application> {
    return this.prisma.application.update({
      where: { id },
      data: {
        decisionDate,
        decisionReason,
        updatedBy,
      },
    });
  }

  async createHistory(
    applicationId: string,
    changedField: string,
    previousValue: string | null,
    newValue: string | null,
    changedBy: string,
    changeReason: string,
    changeReference?: string,
  ): Promise<ApplicationHistory> {
    return this.prisma.applicationHistory.create({
      data: {
        applicationId,
        changedField,
        previousValue,
        newValue,
        changedAt: new Date(),
        changedBy,
        changeReason,
        changeReference: changeReference ?? null,
      },
    });
  }

  async getHistory(applicationId: string): Promise<ApplicationHistory[]> {
    return this.prisma.applicationHistory.findMany({
      where: { applicationId },
      orderBy: { changedAt: 'desc' },
    });
  }

  async uploadDocument(
    applicationId: string,
    input: DocumentUploadInput,
  ): Promise<ApplicationDocument> {
    return this.prisma.applicationDocument.create({
      data: {
        applicationId,
        documentType: input.documentType,
        fileName: input.fileName,
        storagePath: input.storagePath,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        uploadedAt: new Date(),
        uploadedBy: input.uploadedBy,
        uploadReason: input.uploadReason,
      },
    });
  }

  async getDocuments(applicationId: string): Promise<ApplicationDocument[]> {
    return this.prisma.applicationDocument.findMany({
      where: { applicationId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async toResponse(application: Application): ApplicationResponse {
    return {
      id: application.id,
      studentId: application.studentId,
      programmeId: application.programmeId,
      sessionId: application.sessionId,
      status: application.status as ApplicationStatus,
      personalStatement: application.personalStatement ?? undefined,
      academicHistory: application.academicHistory ?? undefined,
      submittedAt: application.submittedAt ?? undefined,
      decisionDate: application.decisionDate ?? undefined,
      decisionReason: application.decisionReason ?? undefined,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      createdBy: application.createdBy,
      updatedBy: application.updatedBy,
      statusChangedAt: application.statusChangedAt,
      statusChangedBy: application.statusChangedBy,
      statusChangeReason: application.statusChangeReason,
    };
  }

  async toHistoryRecord(history: ApplicationHistory): Promise<ApplicationHistoryRecord> {
    return {
      id: history.id,
      applicationId: history.applicationId,
      changedField: history.changedField,
      previousValue: history.previousValue ?? undefined,
      newValue: history.newValue ?? undefined,
      changedAt: history.changedAt,
      changedBy: history.changedBy,
      changeReason: history.changeReason,
      changeReference: history.changeReference ?? undefined,
      createdAt: history.createdAt,
    };
  }

  async toDocumentResponse(document: ApplicationDocument): Promise<ApplicationDocumentResponse> {
    return {
      id: document.id,
      applicationId: document.applicationId,
      documentType: document.documentType,
      fileName: document.fileName,
      storagePath: document.storagePath,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedAt: document.uploadedAt,
      uploadedBy: document.uploadedBy,
      uploadReason: document.uploadReason ?? undefined,
      changeReference: document.changeReference ?? undefined,
      createdAt: document.createdAt,
    };
  }
}
