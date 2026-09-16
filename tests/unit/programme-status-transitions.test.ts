import { describe, expect, it } from 'vitest';
import {
    canArchiveProgramme,
    canModifyProgramme,
    canPublishProgramme,
    isTerminalStatus,
    isValidStatusTransition,
    validateStatusTransition,
} from '../../src/modules/programme/domain/programme-status-transitions.js';
import { InvalidProgrammeStatusTransitionError } from '../../src/modules/programme/domain/programme.js';

describe('Programme Status Transitions', () => {
    describe('isValidStatusTransition', () => {
        it('allows DRAFT to PUBLISHED', () => {
            expect(isValidStatusTransition('DRAFT', 'PUBLISHED')).toBe(true);
        });

        it('allows DRAFT to ARCHIVED', () => {
            expect(isValidStatusTransition('DRAFT', 'ARCHIVED')).toBe(true);
        });

        it('allows PUBLISHED to ARCHIVED', () => {
            expect(isValidStatusTransition('PUBLISHED', 'ARCHIVED')).toBe(true);
        });

        it('does not allow PUBLISHED to DRAFT', () => {
            expect(isValidStatusTransition('PUBLISHED', 'DRAFT')).toBe(false);
        });

        it('does not allow ARCHIVED to any status', () => {
            expect(isValidStatusTransition('ARCHIVED', 'DRAFT')).toBe(false);
            expect(isValidStatusTransition('ARCHIVED', 'PUBLISHED')).toBe(false);
        });

        it('does not allow invalid transitions', () => {
            expect(isValidStatusTransition('DRAFT', 'DRAFT')).toBe(false);
        });
    });

    describe('validateStatusTransition', () => {
        it('validates valid transitions', () => {
            expect(() => validateStatusTransition('DRAFT', 'PUBLISHED')).not.toThrow();
            expect(() => validateStatusTransition('PUBLISHED', 'ARCHIVED')).not.toThrow();
        });

        it('throws error for invalid transitions', () => {
            expect(() => validateStatusTransition('ARCHIVED', 'DRAFT')).toThrow(
                InvalidProgrammeStatusTransitionError,
            );
            expect(() => validateStatusTransition('PUBLISHED', 'DRAFT')).toThrow(
                InvalidProgrammeStatusTransitionError,
            );
        });
    });

    describe('isTerminalStatus', () => {
        it('returns true for ARCHIVED', () => {
            expect(isTerminalStatus('ARCHIVED')).toBe(true);
        });

        it('returns false for non-terminal statuses', () => {
            expect(isTerminalStatus('DRAFT')).toBe(false);
            expect(isTerminalStatus('PUBLISHED')).toBe(false);
        });
    });

    describe('canModifyProgramme', () => {
        it('returns true for DRAFT', () => {
            expect(canModifyProgramme('DRAFT')).toBe(true);
        });

        it('returns false for PUBLISHED', () => {
            expect(canModifyProgramme('PUBLISHED')).toBe(false);
        });

        it('returns false for ARCHIVED', () => {
            expect(canModifyProgramme('ARCHIVED')).toBe(false);
        });
    });

    describe('canPublishProgramme', () => {
        it('returns true for DRAFT', () => {
            expect(canPublishProgramme('DRAFT')).toBe(true);
        });

        it('returns false for PUBLISHED', () => {
            expect(canPublishProgramme('PUBLISHED')).toBe(false);
        });

        it('returns false for ARCHIVED', () => {
            expect(canPublishProgramme('ARCHIVED')).toBe(false);
        });
    });

    describe('canArchiveProgramme', () => {
        it('returns true for DRAFT', () => {
            expect(canArchiveProgramme('DRAFT')).toBe(true);
        });

        it('returns true for PUBLISHED', () => {
            expect(canArchiveProgramme('PUBLISHED')).toBe(true);
        });

        it('returns false for ARCHIVED', () => {
            expect(canArchiveProgramme('ARCHIVED')).toBe(false);
        });
    });
});
