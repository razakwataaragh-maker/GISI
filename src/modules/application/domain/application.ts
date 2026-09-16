export class ApplicationNotFoundError extends Error {
  constructor(applicationId: string) {
    super(`Application not found: ${applicationId}`);
    this.name = 'ApplicationNotFoundError';
  }
}

export class InvalidApplicationStatusError extends Error {
  constructor(currentStatus: string, targetStatus: string) {
    super(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
    this.name = 'InvalidApplicationStatusError';
  }
}

export class ApplicationModificationNotAllowedError extends Error {
  constructor(status: string) {
    super(`Application modification not allowed in status: ${status}`);
    this.name = 'ApplicationModificationNotAllowedError';
  }
}

export class ApplicationSubmissionValidationError extends Error {
  constructor(reason: string) {
    super(`Application submission validation failed: ${reason}`);
    this.name = 'ApplicationSubmissionValidationError';
  }
}

export class ApplicationDecisionNotAllowedError extends Error {
  constructor(status: string) {
    super(`Application decision not allowed in status: ${status}`);
    this.name = 'ApplicationDecisionNotAllowedError';
  }
}

export class ApplicationTerminalStateError extends Error {
  constructor(status: string) {
    super(`Application is in terminal state: ${status}`);
    this.name = 'ApplicationTerminalStateError';
  }
}

export class InvalidApplicationWindowError extends Error {
  constructor(reason: string) {
    super(`Application window validation failed: ${reason}`);
    this.name = 'InvalidApplicationWindowError';
  }
}

export class ProgrammeNotAcceptingApplicationsError extends Error {
  constructor(programmeId: string) {
    super(`Programme is not accepting applications: ${programmeId}`);
    this.name = 'ProgrammeNotAcceptingApplicationsError';
  }
}

export class SessionNotOpenForApplicationsError extends Error {
  constructor(sessionId: string) {
    super(`Session is not open for applications: ${sessionId}`);
    this.name = 'SessionNotOpenForApplicationsError';
  }
}

export class StudentProfileIncompleteError extends Error {
  constructor(studentId: string) {
    super(`Student profile is incomplete: ${studentId}`);
    this.name = 'StudentProfileIncompleteError';
  }
}

export class RequiredDocumentsMissingError extends Error {
  constructor(applicationId: string) {
    super(`Required documents are missing for application: ${applicationId}`);
    this.name = 'RequiredDocumentsMissingError';
  }
}
