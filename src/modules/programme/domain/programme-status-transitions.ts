import type { ProgrammeStatus } from '../contracts/programme.js';
import { InvalidProgrammeStatusTransitionError } from './programme.js';

/**
 * Valid programme status transitions
 * Key: current status, Value: array of allowed next statuses
 */
const VALID_TRANSITIONS: Record<ProgrammeStatus, ProgrammeStatus[]> = {
    DRAFT: ['PUBLISHED', 'ARCHIVED'],
    PUBLISHED: ['ARCHIVED'],
    ARCHIVED: [], // Terminal state - no transitions allowed
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
    currentStatus: ProgrammeStatus,
    newStatus: ProgrammeStatus,
): boolean {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
}

/**
 * Validate a status transition and throw error if invalid
 */
export function validateStatusTransition(
    currentStatus: ProgrammeStatus,
    newStatus: ProgrammeStatus,
): void {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
        throw new InvalidProgrammeStatusTransitionError(currentStatus, newStatus);
    }
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: ProgrammeStatus): boolean {
    return status === 'ARCHIVED';
}

/**
 * Check if a programme can be modified based on its status
 */
export function canModifyProgramme(status: ProgrammeStatus): boolean {
    return status === 'DRAFT';
}

/**
 * Check if a programme can be published
 */
export function canPublishProgramme(status: ProgrammeStatus): boolean {
    return status === 'DRAFT';
}

/**
 * Check if a programme can be archived
 */
export function canArchiveProgramme(status: ProgrammeStatus): boolean {
    return status === 'DRAFT' || status === 'PUBLISHED';
}
