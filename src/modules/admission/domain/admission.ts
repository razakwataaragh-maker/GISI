export class AdmissionNotFoundError extends Error {
  constructor(admissionId: string) {
    super(`Admission not found: ${admissionId}`);
    this.name = 'AdmissionNotFoundError';
  }
}

export class InvalidAdmissionStatusError extends Error {
  constructor(currentStatus: string, targetStatus: string) {
    super(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
    this.name = 'InvalidAdmissionStatusError';
  }
}

export class AdmissionActionNotAllowedError extends Error {
  constructor(status: string, action: string) {
    super(`Admission ${action} not allowed in status: ${status}`);
    this.name = 'AdmissionActionNotAllowedError';
  }
}

export class AdmissionDeadlineExpiredError extends Error {
  constructor(admissionId: string) {
    super(`Admission deadline has expired: ${admissionId}`);
    this.name = 'AdmissionDeadlineExpiredError';
  }
}

export class AdmissionAlreadyExistsError extends Error {
  constructor(applicationId: string) {
    super(`Admission already exists for application: ${applicationId}`);
    this.name = 'AdmissionAlreadyExistsError';
  }
}

export class ApplicationNotApprovedError extends Error {
  constructor(applicationId: string) {
    super(`Application is not approved: ${applicationId}`);
    this.name = 'ApplicationNotApprovedError';
  }
}

export class DeferralNotAllowedError extends Error {
  constructor(reason: string) {
    super(`Deferral not allowed: ${reason}`);
    this.name = 'DeferralNotAllowedError';
  }
}

export class AdmissionTerminalStateError extends Error {
  constructor(status: string) {
    super(`Admission is in terminal state: ${status}`);
    this.name = 'AdmissionTerminalStateError';
  }
}
