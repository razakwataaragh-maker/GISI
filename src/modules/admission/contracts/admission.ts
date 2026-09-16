export enum AdmissionStatus {
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  DEFERRED = 'DEFERRED',
  EXPIRED = 'EXPIRED',
}

export interface CreateAdmissionInput {
  applicationId: string;
  studentId: string;
  programmeId: string;
  sessionId: string;
  offerDate: Date;
  acceptanceDeadline: Date;
  createdBy: string;
}

export interface SearchAdmissionsInput {
  studentId?: string;
  applicationId?: string;
  programmeId?: string;
  sessionId?: string;
  status?: AdmissionStatus;
  offeredAfter?: Date;
  offeredBefore?: Date;
  deadlineAfter?: Date;
  deadlineBefore?: Date;
}

export interface AdmissionResponse {
  id: string;
  applicationId: string;
  studentId: string;
  programmeId: string;
  sessionId: string;
  status: AdmissionStatus;
  offerDate: Date;
  acceptanceDeadline: Date;
  acceptedAt?: Date;
  deferredAt?: Date;
  deferralEndDate?: Date;
  declinedAt?: Date;
  expiredAt?: Date;
  admissionLetter?: string;
  letterGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  statusChangedAt: Date;
  statusChangedBy: string;
  statusChangeReason: string;
}

export interface AdmissionHistoryRecord {
  id: string;
  admissionId: string;
  changedField: string;
  previousValue?: string;
  newValue?: string;
  changedAt: Date;
  changedBy: string;
  changeReason: string;
  changeReference?: string;
  createdAt: Date;
}

export interface AcceptAdmissionInput {
  acceptedBy: string;
}

export interface DeferAdmissionInput {
  deferralEndDate: Date;
  deferredBy: string;
}

export interface DeclineAdmissionInput {
  declinedBy: string;
}

export interface AdmissionLetterResponse {
  letter: string;
  generatedAt: Date;
}
