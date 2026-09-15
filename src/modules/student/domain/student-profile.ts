import type {
    StudentProfile,
    StudentStatus,
    StudentStatusHistoryEntry,
    StudentStatusTransition,
} from '../contracts/student-profile.js';

export class StudentManagementError extends Error {
    constructor(message: string, readonly code: string) {
        super(message);
        this.name = 'StudentManagementError';
    }
}

export class StudentNotFoundError extends StudentManagementError {
    constructor(id: string) {
        super(`Student ${id} was not found`, 'STUDENT_NOT_FOUND');
        this.name = 'StudentNotFoundError';
    }
}

export class DuplicateStudentNumberError extends StudentManagementError {
    constructor(studentNumber: string) {
        super(
            `A student with number ${studentNumber} already exists`,
            'DUPLICATE_STUDENT_NUMBER',
        );
        this.name = 'DuplicateStudentNumberError';
    }
}

export class UnauthorizedStudentManagementError extends StudentManagementError {
    constructor(action: string) {
        super(`The actor is not authorized to ${action}`, 'UNAUTHORIZED');
        this.name = 'UnauthorizedStudentManagementError';
    }
}

export class InvalidStudentStatusTransitionError extends StudentManagementError {
    constructor(
        readonly transition: StudentStatusTransition,
        readonly from: StudentStatus,
    ) {
        super(
            `Cannot ${transition} a student from ${from}`,
            'INVALID_STUDENT_STATUS_TRANSITION',
        );
        this.name = 'InvalidStudentStatusTransitionError';
    }
}

export class InvalidStudentUpdateError extends StudentManagementError {
    constructor(field: string) {
        super(
            `Student field ${field} is not an approved update field`,
            'INVALID_STUDENT_UPDATE',
        );
        this.name = 'InvalidStudentUpdateError';
    }
}

export function nextStudentStatus(
    current: StudentStatus,
    transition: StudentStatusTransition,
): StudentStatus {
    const allowed: Record<StudentStatusTransition, StudentStatus> = {
        activate: 'ACTIVE',
        deactivate: 'INACTIVE',
        suspend: 'SUSPENDED',
        reactivate: 'ACTIVE',
        graduate: 'GRADUATED',
        withdraw: 'WITHDRAWN',
    };

    const valid =
        (transition === 'activate' && current === 'INACTIVE') ||
        (transition === 'deactivate' && current === 'ACTIVE') ||
        (transition === 'suspend' && current === 'ACTIVE') ||
        (transition === 'reactivate' && current === 'SUSPENDED') ||
        (transition === 'graduate' && current === 'ACTIVE') ||
        (transition === 'withdraw' &&
            (current === 'ACTIVE' ||
                current === 'INACTIVE' ||
                current === 'SUSPENDED'));

    if (!valid) {
        throw new InvalidStudentStatusTransitionError(transition, current);
    }

    return allowed[transition];
}

export function studentStatusHistoryEntry(
    status: StudentStatus,
    changedAt: Date,
    changedBy: string,
    reason: string,
): StudentStatusHistoryEntry {
    return { status, changedAt, changedBy, reason };
}

export function applyStudentStatusChange(
    student: StudentProfile,
    status: StudentStatus,
    changedAt: Date,
    changedBy: string,
    reason: string,
): StudentProfile {
    const entry = studentStatusHistoryEntry(status, changedAt, changedBy, reason);

    return {
        ...student,
        status,
        updatedAt: changedAt,
        statusChangedAt: changedAt,
        statusChangedBy: changedBy,
        statusHistory: [...student.statusHistory, entry],
    };
}
