import type { StudentStatus } from '../contracts/student.js';
import { InvalidStudentStatusTransitionError } from './student.js';

/**
 * Valid student status transitions
 * Key: current status, Value: array of allowed next statuses
 */
const VALID_TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
    ACTIVE: ['INACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN'],
    INACTIVE: ['ACTIVE', 'SUSPENDED'],
    SUSPENDED: ['ACTIVE', 'INACTIVE', 'WITHDRAWN'],
    GRADUATED: [], // Terminal state - no transitions allowed
    WITHDRAWN: [], // Terminal state - no transitions allowed
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
    currentStatus: StudentStatus,
    newStatus: StudentStatus,
): boolean {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
}

/**
 * Validate a status transition and throw error if invalid
 */
export function validateStatusTransition(
    currentStatus: StudentStatus,
    newStatus: StudentStatus,
): void {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
        throw new InvalidStudentStatusTransitionError(currentStatus, newStatus);
    }
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: StudentStatus): boolean {
    return status === 'GRADUATED' || status === 'WITHDRAWN';
}

/**
 * Check if a student can be modified based on their status
 */
export function canModifyStudent(status: StudentStatus): boolean {
    return !isTerminalStatus(status);
}
