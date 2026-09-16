/**
 * Domain errors for session management
 */

export class SessionError extends Error {
    constructor(
        message: string,
        readonly code: string,
    ) {
        super(message);
        this.name = 'SessionError';
    }
}

export class SessionNotFoundError extends SessionError {
    constructor(id: string) {
        super(`Session ${id} was not found`, 'SESSION_NOT_FOUND');
        this.name = 'SessionNotFoundError';
    }
}

export class InvalidSessionDatesError extends SessionError {
    constructor(message: string) {
        super(message, 'INVALID_SESSION_DATES');
        this.name = 'InvalidSessionDatesError';
    }
}

export class InvalidSessionWindowError extends SessionError {
    constructor(message: string) {
        super(message, 'INVALID_SESSION_WINDOW');
        this.name = 'InvalidSessionWindowError';
    }
}

export class InvalidSessionStatusError extends SessionError {
    constructor(currentStatus: string, requestedStatus: string) {
        super(`Cannot transition from ${currentStatus} to ${requestedStatus}`, 'INVALID_SESSION_STATUS');
        this.name = 'InvalidSessionStatusError';
    }
}

export class InvalidSessionStatusTransitionError extends SessionError {
    constructor(currentStatus: string, requestedStatus: string) {
        super(`Invalid status transition from ${currentStatus} to ${requestedStatus}`, 'INVALID_SESSION_STATUS_TRANSITION');
        this.name = 'InvalidSessionStatusTransitionError';
    }
}

export class SessionAlreadyOpenError extends SessionError {
    constructor(sessionId: string) {
        super(`Session ${sessionId} is already open`, 'SESSION_ALREADY_OPEN');
        this.name = 'SessionAlreadyOpenError';
    }
}

export class SessionAlreadyClosedError extends SessionError {
    constructor(sessionId: string) {
        super(`Session ${sessionId} is already closed`, 'SESSION_ALREADY_CLOSED');
        this.name = 'SessionAlreadyClosedError';
    }
}

export class SessionAlreadyArchivedError extends SessionError {
    constructor(sessionId: string) {
        super(`Session ${sessionId} is already archived and cannot be modified`, 'SESSION_ALREADY_ARCHIVED');
        this.name = 'SessionAlreadyArchivedError';
    }
}

export class SessionCannotOpenError extends SessionError {
    constructor(sessionId: string, reason: string) {
        super(`Session ${sessionId} cannot be opened: ${reason}`, 'SESSION_CANNOT_OPEN');
        this.name = 'SessionCannotOpenError';
    }
}

export class SessionCannotCloseError extends SessionError {
    constructor(sessionId: string, reason: string) {
        super(`Session ${sessionId} cannot be closed: ${reason}`, 'SESSION_CANNOT_CLOSE');
        this.name = 'SessionCannotCloseError';
    }
}
