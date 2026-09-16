/**
 * Domain errors for programme management
 */

export class ProgrammeError extends Error {
    constructor(
        message: string,
        readonly code: string,
    ) {
        super(message);
        this.name = 'ProgrammeError';
    }
}

export class ProgrammeNotFoundError extends ProgrammeError {
    constructor(id: string) {
        super(`Programme ${id} was not found`, 'PROGRAMME_NOT_FOUND');
        this.name = 'ProgrammeNotFoundError';
    }
}

export class ProgrammeCodeAlreadyExistsError extends ProgrammeError {
    constructor(programmeCode: string) {
        super(`Programme code ${programmeCode} already exists`, 'PROGRAMME_CODE_ALREADY_EXISTS');
        this.name = 'ProgrammeCodeAlreadyExistsError';
    }
}

export class InvalidProgrammeStatusError extends ProgrammeError {
    constructor(currentStatus: string, requestedStatus: string) {
        super(`Cannot transition from ${currentStatus} to ${requestedStatus}`, 'INVALID_PROGRAMME_STATUS');
        this.name = 'InvalidProgrammeStatusError';
    }
}

export class InvalidProgrammeStatusTransitionError extends ProgrammeError {
    constructor(currentStatus: string, requestedStatus: string) {
        super(`Invalid status transition from ${currentStatus} to ${requestedStatus}`, 'INVALID_PROGRAMME_STATUS_TRANSITION');
        this.name = 'InvalidProgrammeStatusTransitionError';
    }
}

export class ProgrammeAlreadyPublishedError extends ProgrammeError {
    constructor(programmeId: string) {
        super(`Programme ${programmeId} is already published and cannot be modified`, 'PROGRAMME_ALREADY_PUBLISHED');
        this.name = 'ProgrammeAlreadyPublishedError';
    }
}

export class ProgrammeAlreadyArchivedError extends ProgrammeError {
    constructor(programmeId: string) {
        super(`Programme ${programmeId} is already archived and cannot be modified`, 'PROGRAMME_ALREADY_ARCHIVED');
        this.name = 'ProgrammeAlreadyArchivedError';
    }
}

export class ProgrammeCannotPublishDraftError extends ProgrammeError {
    constructor(programmeId: string) {
        super(`Programme ${programmeId} cannot be published - required fields are missing`, 'PROGRAMME_CANNOT_PUBLISH_DRAFT');
        this.name = 'ProgrammeCannotPublishDraftError';
    }
}
