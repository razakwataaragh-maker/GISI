import type { SessionStatus } from '../contracts/session.js';
import { InvalidSessionStatusTransitionError } from './session.js';

/**
 * Valid session status transitions
 * Key: current status, Value: array of allowed next statuses
 */
const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
    DRAFT: ['OPEN', 'ARCHIVED'],
    OPEN: ['CLOSED', 'ARCHIVED'],
    CLOSED: ['ARCHIVED'],
    ARCHIVED: [], // Terminal state - no transitions allowed
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
    currentStatus: SessionStatus,
    newStatus: SessionStatus,
): boolean {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    return allowedTransitions.includes(newStatus);
}

/**
 * Validate a status transition and throw error if invalid
 */
export function validateStatusTransition(
    currentStatus: SessionStatus,
    newStatus: SessionStatus,
): void {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
        throw new InvalidSessionStatusTransitionError(currentStatus, newStatus);
    }
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: SessionStatus): boolean {
    return status === 'ARCHIVED';
}

/**
 * Check if a session can be modified based on its status
 */
export function canModifySession(status: SessionStatus): boolean {
    return status === 'DRAFT';
}

/**
 * Check if a session can be opened
 */
export function canOpenSession(status: SessionStatus): boolean {
    return status === 'DRAFT';
}

/**
 * Check if a session can be closed
 */
export function canCloseSession(status: SessionStatus): boolean {
    return status === 'OPEN';
}

/**
 * Check if a session can be archived
 */
export function canArchiveSession(status: SessionStatus): boolean {
    return status === 'DRAFT' || status === 'OPEN' || status === 'CLOSED';
}
