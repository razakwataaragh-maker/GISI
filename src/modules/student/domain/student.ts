/**
 * Domain errors for student management
 */

export class StudentError extends Error {
    constructor(
        message: string,
        readonly code: string,
    ) {
        super(message);
        this.name = 'StudentError';
    }
}

export class StudentNotFoundError extends StudentError {
    constructor(id: string) {
        super(`Student ${id} was not found`, 'STUDENT_NOT_FOUND');
        this.name = 'StudentNotFoundError';
    }
}

export class StudentNumberAlreadyExistsError extends StudentError {
    constructor(studentNumber: string) {
        super(`Student number ${studentNumber} already exists`, 'STUDENT_NUMBER_ALREADY_EXISTS');
        this.name = 'StudentNumberAlreadyExistsError';
    }
}

export class InvalidStudentStatusError extends StudentError {
    constructor(currentStatus: string, requestedStatus: string) {
        super(`Cannot transition from ${currentStatus} to ${requestedStatus}`, 'INVALID_STUDENT_STATUS');
        this.name = 'InvalidStudentStatusError';
    }
}

export class InvalidStudentStatusTransitionError extends StudentError {
    constructor(currentStatus: string, requestedStatus: string) {
        super(`Invalid status transition from ${currentStatus} to ${requestedStatus}`, 'INVALID_STUDENT_STATUS_TRANSITION');
        this.name = 'InvalidStudentStatusTransitionError';
    }
}

export class StudentAlreadyGraduatedError extends StudentError {
    constructor(studentId: string) {
        super(`Student ${studentId} is already graduated and cannot be modified`, 'STUDENT_ALREADY_GRADUATED');
        this.name = 'StudentAlreadyGraduatedError';
    }
}

export class StudentAlreadyWithdrawnError extends StudentError {
    constructor(studentId: string) {
        super(`Student ${studentId} is already withdrawn and cannot be modified`, 'STUDENT_ALREADY_WITHDRAWN');
        this.name = 'StudentAlreadyWithdrawnError';
    }
}

export class StudentDocumentNotFoundError extends StudentError {
    constructor(documentId: string) {
        super(`Student document ${documentId} was not found`, 'STUDENT_DOCUMENT_NOT_FOUND');
        this.name = 'StudentDocumentNotFoundError';
    }
}

export class InvalidDocumentTypeError extends StudentError {
    constructor(documentType: string) {
        super(`Invalid document type: ${documentType}`, 'INVALID_DOCUMENT_TYPE');
        this.name = 'InvalidDocumentTypeError';
    }
}
