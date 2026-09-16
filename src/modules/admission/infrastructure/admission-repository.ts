import { PrismaClient } from '@prisma/client';
import {
  Admission,
  AdmissionHistory,
  Prisma,
} from '@prisma/client';
import {
  CreateAdmissionInput,
  SearchAdmissionsInput,
  AdmissionResponse,
  AdmissionHistoryRecord,
  AdmissionStatus,
} from '../contracts/admission';

export class AdmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateAdmissionInput): Promise<Admission> {
    return this.prisma.admission.create({
      data: {
        applicationId: input.applicationId,
        studentId: input.studentId,
        programmeId: input.programmeId,
        sessionId: input.sessionId,
        status: AdmissionStatus.OFFERED,
        offerDate: input.offerDate,
        acceptanceDeadline: input.acceptanceDeadline,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
        statusChangedBy: input.createdBy,
        statusChangeReason: 'Admission offered',
      },
    });
  }

  async findById(id: string): Promise<Admission | null> {
    return this.prisma.admission.findUnique({
      where: { id },
    });
  }

  async findByApplicationId(applicationId: string): Promise<Admission | null> {
    return this.prisma.admission.findUnique({
      where: { applicationId },
    });
  }

  async search(params: SearchAdmissionsInput): Promise<Admission[]> {
    const where: Prisma.AdmissionWhereInput = {};

    if (params.studentId) {
      where.studentId = params.studentId;
    }

    if (params.applicationId) {
      where.applicationId = params.applicationId;
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

    if (params.offeredAfter || params.offeredBefore) {
      where.offerDate = {};
      if (params.offeredAfter) {
        where.offerDate.gte = params.offeredAfter;
      }
      if (params.offeredBefore) {
        where.offerDate.lte = params.offeredBefore;
      }
    }

    if (params.deadlineAfter || params.deadlineBefore) {
      where.acceptanceDeadline = {};
      if (params.deadlineAfter) {
        where.acceptanceDeadline.gte = params.deadlineAfter;
      }
      if (params.deadlineBefore) {
        where.acceptanceDeadline.lte = params.deadlineBefore;
      }
    }

    return this.prisma.admission.findMany({
      where,
      orderBy: { offerDate: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    status: AdmissionStatus,
    changedBy: string,
    reason: string,
  ): Promise<Admission> {
    return this.prisma.admission.update({
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

  async setAcceptedAt(id: string, acceptedAt: Date): Promise<Admission> {
    return this.prisma.admission.update({
      where: { id },
      data: { acceptedAt },
    });
  }

  async setDeferred(
    id: string,
    deferredAt: Date,
    deferralEndDate: Date,
    updatedBy: string,
  ): Promise<Admission> {
    return this.prisma.admission.update({
      where: { id },
      data: {
        deferredAt,
        deferralEndDate,
        updatedBy,
      },
    });
  }

  async setDeclinedAt(id: string, declinedAt: Date, updatedBy: string): Promise<Admission> {
    return this.prisma.admission.update({
      where: { id },
      data: {
        declinedAt,
        updatedBy,
      },
    });
  }

  async setExpiredAt(id: string, expiredAt: Date, updatedBy: string): Promise<Admission> {
    return this.prisma.admission.update({
      where: { id },
      data: {
        expiredAt,
        updatedBy,
      },
    });
  }

  async setAdmissionLetter(
    id: string,
    letter: string,
    letterGeneratedAt: Date,
    updatedBy: string,
  ): Promise<Admission> {
    return this.prisma.admission.update({
      where: { id },
      data: {
        admissionLetter: letter,
        letterGeneratedAt,
        updatedBy,
      },
    });
  }

  async createHistory(
    admissionId: string,
    changedField: string,
    previousValue: string | null,
    newValue: string | null,
    changedBy: string,
    changeReason: string,
    changeReference?: string,
  ): Promise<AdmissionHistory> {
    return this.prisma.admissionHistory.create({
      data: {
        admissionId,
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

  async getHistory(admissionId: string): Promise<AdmissionHistory[]> {
    return this.prisma.admissionHistory.findMany({
      where: { admissionId },
      orderBy: { changedAt: 'desc' },
    });
  }

  async toResponse(admission: Admission): AdmissionResponse {
    return {
      id: admission.id,
      applicationId: admission.applicationId,
      studentId: admission.studentId,
      programmeId: admission.programmeId,
      sessionId: admission.sessionId,
      status: admission.status as AdmissionStatus,
      offerDate: admission.offerDate,
      acceptanceDeadline: admission.acceptanceDeadline,
      acceptedAt: admission.acceptedAt ?? undefined,
      deferredAt: admission.deferredAt ?? undefined,
      deferralEndDate: admission.deferralEndDate ?? undefined,
      declinedAt: admission.declinedAt ?? undefined,
      expiredAt: admission.expiredAt ?? undefined,
      admissionLetter: admission.admissionLetter ?? undefined,
      letterGeneratedAt: admission.letterGeneratedAt ?? undefined,
      createdAt: admission.createdAt,
      updatedAt: admission.updatedAt,
      createdBy: admission.createdBy,
      updatedBy: admission.updatedBy,
      statusChangedAt: admission.statusChangedAt,
      statusChangedBy: admission.statusChangedBy,
      statusChangeReason: admission.statusChangeReason,
    };
  }

  async toHistoryRecord(history: AdmissionHistory): AdmissionHistoryRecord {
    return {
      id: history.id,
      admissionId: history.admissionId,
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
}
