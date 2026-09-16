export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INFORMATION_REQUESTED = 'INFORMATION_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CreateApplicationInput {
  studentId: string;
  programmeId: string;
  sessionId: string;
  personalStatement?: string;
  academicHistory?: string;
  createdBy: string;
}

export interface UpdateApplicationInput {
  personalStatement?: string;
  academicHistory?: string;
  updatedBy: string;
}

export interface SearchApplicationsInput {
  studentId?: string;
  programmeId?: string;
  sessionId?: string;
  status?: ApplicationStatus;
  submittedAfter?: Date;
  submittedBefore?: Date;
  decidedAfter?: Date;
  decidedBefore?: Date;
}

export interface ApplicationResponse {
  id: string;
  studentId: string;
  programmeId: string;
  sessionId: string;
  status: ApplicationStatus;
  personalStatement?: string;
  academicHistory?: string;
  submittedAt?: Date;
  decisionDate?: Date;
  decisionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  statusChangedAt: Date;
  statusChangedBy: string;
  statusChangeReason: string;
}

export interface ApplicationHistoryRecord {
  id: string;
  applicationId: string;
  changedField: string;
  previousValue?: string;
  newValue?: string;
  changedAt: Date;
  changedBy: string;
  changeReason: string;
  changeReference?: string;
  createdAt: Date;
}

export interface ApplicationDocumentResponse {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  uploadReason?: string;
  changeReference?: string;
  createdAt: Date;
}

export interface SubmitApplicationInput {
  submittedBy: string;
}

export interface RequestInformationInput {
  reason: string;
  requestedBy: string;
}

export interface ApproveApplicationInput {
  reason: string;
  approvedBy: string;
}

export interface RejectApplicationInput {
  reason: string;
  rejectedBy: string;
}

export interface DocumentUploadInput {
  documentType: string;
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadReason?: string;
}
