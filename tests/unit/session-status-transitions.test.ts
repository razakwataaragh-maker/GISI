import { describe, expect, it } from 'vitest';
import {
    canArchiveSession,
    canCloseSession,
    canModifySession,
    canOpenSession,
    isTerminalStatus,
    isValidStatusTransition,
    validateStatusTransition,
} from '../../src/modules/session/domain/session-status-transitions.js';
import { InvalidSessionStatusTransitionError } from '../../src/modules/session/domain/session.js';

describe('Session Status Transitions', () => {
    describe('isValidStatusTransition', () => {
        it('allows DRAFT to OPEN', () => {
            expect(isValidStatusTransition('DRAFT', 'OPEN')).toBe(true);
        });

        it('allows DRAFT to ARCHIVED', () => {
            expect(isValidStatusTransition('DRAFT', 'ARCHIVED')).toBe(true);
        });

        it('allows OPEN to CLOSED', () => {
            expect(isValidStatusTransition('OPEN', 'CLOSED')).toBe(true);
        });

        it('allows OPEN to ARCHIVED', () => {
            expect(isValidStatusTransition('OPEN', 'ARCHIVED')).toBe(true);
        });

        it('allows CLOSED to ARCHIVED', () => {
            expect(isValidStatusTransition('CLOSED', 'ARCHIVED')).toBe(true);
        });

        it('does not allow OPEN to DRAFT', () => {
            expect(isValidStatusTransition('OPEN', 'DRAFT')).toBe(false);
        });

        it('does not allow CLOSED to OPEN', () => {
            expect(isValidStatusTransition('CLOSED', 'OPEN')).toBe(false);
        });

        it('does not allow ARCHIVED to any status', () => {
            expect(isValidStatusTransition('ARCHIVED', 'DRAFT')).toBe(false);
            expect(isValidStatusTransition('ARCHIVED', 'OPEN')).toBe(false);
            expect(isValidStatusTransition('ARCHIVED', 'CLOSED')).toBe(false);
        });

        it('does not allow invalid transitions', () => {
            expect(isValidStatusTransition('DRAFT', 'DRAFT')).toBe(false);
        });
    });

    describe('validateStatusTransition', () => {
        it('validates valid transitions', () => {
            expect(() => validateStatusTransition('DRAFT', 'OPEN')).not.toThrow();
            expect(() => validateStatusTransition('OPEN', 'CLOSED')).not.toThrow();
        });

        it('throws error for invalid transitions', () => {
            expect(() => validateStatusTransition('ARCHIVED', 'DRAFT')).toThrow(
                InvalidSessionStatusTransitionError,
            );
            expect(() => validateStatusTransition('CLOSED', 'OPEN')).toThrow(
                InvalidSessionStatusTransitionError,
            );
        });
    });

    describe('isTerminalStatus', () => {
        it('returns true for ARCHIVED', () => {
            expect(isTerminalStatus('ARCHIVED')).toBe(true);
        });

        it('returns false for non-terminal statuses', () => {
            expect(isTerminalStatus('DRAFT')).toBe(false);
            expect(isTerminalStatus('OPEN')).toBe(false);
            expect(isTerminalStatus('CLOSED')).toBe(false);
        });
    });

    describe('canModifySession', () => {
        it('returns true for DRAFT', () => {
            expect(canModifySession('DRAFT')).toBe(true);
        });

        it('returns false for OPEN', () => {
            expect(canModifySession('OPEN')).toBe(false);
        });

        it('returns false for CLOSED', () => {
            expect(canModifySession('CLOSED')).toBe(false);
        });

        it('returns false for ARCHIVED', () => {
            expect(canModifySession('ARCHIVED')).toBe(false);
        });
    });

    describe('canOpenSession', () => {
        it('returns true for DRAFT', () => {
            expect(canOpenSession('DRAFT')).toBe(true);
        });

        it('returns false for OPEN', () => {
            expect(canOpenSession('OPEN')).toBe(false);
        });

        it('returns false for CLOSED', () => {
            expect(canOpenSession('CLOSED')).toBe(false);
        });

        it('returns false for ARCHIVED', () => {
            expect(canOpenSession('ARCHIVED')).toBe(false);
        });
    });

    describe('canCloseSession', () => {
        it('returns true for OPEN', () => {
            expect(canCloseSession('OPEN')).toBe(true);
        });

        it('returns false for DRAFT', () => {
            expect(canCloseSession('DRAFT')).toBe(false);
        });

        it('returns false for CLOSED', () => {
            expect(canCloseSession('CLOSED')).toBe(false);
        });

        it('returns false for ARCHIVED', () => {
            expect(canCloseSession('ARCHIVED')).toBe(false);
        });
    });

    describe('canArchiveSession', () => {
        it('returns true for DRAFT', () => {
            expect(canArchiveSession('DRAFT')).toBe(true);
        });

        it('returns true for OPEN', () => {
            expect(canArchiveSession('OPEN')).toBe(true);
        });

        it('returns true for CLOSED', () => {
            expect(canArchiveSession('CLOSED')).toBe(true);
        });

        it('returns false for ARCHIVED', () => {
            expect(canArchiveSession('ARCHIVED')).toBe(false);
        });
    });
});
