import { describe, expect, it } from 'vitest';
import {
    canModifyStudent,
    isTerminalStatus,
    isValidStatusTransition,
    validateStatusTransition,
} from '../../src/modules/student/domain/student-status-transitions.js';
import { InvalidStudentStatusTransitionError } from '../../src/modules/student/domain/student.js';

describe('Student Status Transitions', () => {
    describe('isValidStatusTransition', () => {
        it('allows ACTIVE to INACTIVE', () => {
            expect(isValidStatusTransition('ACTIVE', 'INACTIVE')).toBe(true);
        });

        it('allows ACTIVE to SUSPENDED', () => {
            expect(isValidStatusTransition('ACTIVE', 'SUSPENDED')).toBe(true);
        });

        it('allows ACTIVE to GRADUATED', () => {
            expect(isValidStatusTransition('ACTIVE', 'GRADUATED')).toBe(true);
        });

        it('allows ACTIVE to WITHDRAWN', () => {
            expect(isValidStatusTransition('ACTIVE', 'WITHDRAWN')).toBe(true);
        });

        it('allows INACTIVE to ACTIVE', () => {
            expect(isValidStatusTransition('INACTIVE', 'ACTIVE')).toBe(true);
        });

        it('allows INACTIVE to SUSPENDED', () => {
            expect(isValidStatusTransition('INACTIVE', 'SUSPENDED')).toBe(true);
        });

        it('allows SUSPENDED to ACTIVE', () => {
            expect(isValidStatusTransition('SUSPENDED', 'ACTIVE')).toBe(true);
        });

        it('allows SUSPENDED to INACTIVE', () => {
            expect(isValidStatusTransition('SUSPENDED', 'INACTIVE')).toBe(true);
        });

        it('allows SUSPENDED to WITHDRAWN', () => {
            expect(isValidStatusTransition('SUSPENDED', 'WITHDRAWN')).toBe(true);
        });

        it('does not allow GRADUATED to any status', () => {
            expect(isValidStatusTransition('GRADUATED', 'ACTIVE')).toBe(false);
            expect(isValidStatusTransition('GRADUATED', 'INACTIVE')).toBe(false);
            expect(isValidStatusTransition('GRADUATED', 'SUSPENDED')).toBe(false);
            expect(isValidStatusTransition('GRADUATED', 'WITHDRAWN')).toBe(false);
        });

        it('does not allow WITHDRAWN to any status', () => {
            expect(isValidStatusTransition('WITHDRAWN', 'ACTIVE')).toBe(false);
            expect(isValidStatusTransition('WITHDRAWN', 'INACTIVE')).toBe(false);
            expect(isValidStatusTransition('WITHDRAWN', 'SUSPENDED')).toBe(false);
            expect(isValidStatusTransition('WITHDRAWN', 'GRADUATED')).toBe(false);
        });

        it('does not allow invalid transitions', () => {
            expect(isValidStatusTransition('ACTIVE', 'ACTIVE')).toBe(false);
            expect(isValidStatusTransition('INACTIVE', 'GRADUATED')).toBe(false);
        });
    });

    describe('validateStatusTransition', () => {
        it('validates valid transitions', () => {
            expect(() => validateStatusTransition('ACTIVE', 'INACTIVE')).not.toThrow();
            expect(() => validateStatusTransition('ACTIVE', 'GRADUATED')).not.toThrow();
        });

        it('throws error for invalid transitions', () => {
            expect(() => validateStatusTransition('GRADUATED', 'ACTIVE')).toThrow(
                InvalidStudentStatusTransitionError,
            );
            expect(() => validateStatusTransition('WITHDRAWN', 'ACTIVE')).toThrow(
                InvalidStudentStatusTransitionError,
            );
        });
    });

    describe('isTerminalStatus', () => {
        it('returns true for GRADUATED', () => {
            expect(isTerminalStatus('GRADUATED')).toBe(true);
        });

        it('returns true for WITHDRAWN', () => {
            expect(isTerminalStatus('WITHDRAWN')).toBe(true);
        });

        it('returns false for non-terminal statuses', () => {
            expect(isTerminalStatus('ACTIVE')).toBe(false);
            expect(isTerminalStatus('INACTIVE')).toBe(false);
            expect(isTerminalStatus('SUSPENDED')).toBe(false);
        });
    });

    describe('canModifyStudent', () => {
        it('returns true for modifiable statuses', () => {
            expect(canModifyStudent('ACTIVE')).toBe(true);
            expect(canModifyStudent('INACTIVE')).toBe(true);
            expect(canModifyStudent('SUSPENDED')).toBe(true);
        });

        it('returns false for terminal statuses', () => {
            expect(canModifyStudent('GRADUATED')).toBe(false);
            expect(canModifyStudent('WITHDRAWN')).toBe(false);
        });
    });
});
