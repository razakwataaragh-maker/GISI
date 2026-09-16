import { describe, expect, it } from 'vitest';
import {
    InvalidProgrammeStatusError,
    InvalidProgrammeStatusTransitionError,
    ProgrammeAlreadyArchivedError,
    ProgrammeAlreadyPublishedError,
    ProgrammeCannotPublishDraftError,
    ProgrammeCodeAlreadyExistsError,
    ProgrammeNotFoundError,
} from '../../src/modules/programme/domain/programme.js';

describe('Programme Domain Errors', () => {
    describe('ProgrammeNotFoundError', () => {
        it('creates error with programme ID', () => {
            const error = new ProgrammeNotFoundError('programme-123');
            expect(error.message).toContain('programme-123');
            expect(error.code).toBe('PROGRAMME_NOT_FOUND');
        });
    });

    describe('ProgrammeCodeAlreadyExistsError', () => {
        it('creates error with programme code', () => {
            const error = new ProgrammeCodeAlreadyExistsError('CS101');
            expect(error.message).toContain('CS101');
            expect(error.code).toBe('PROGRAMME_CODE_ALREADY_EXISTS');
        });
    });

    describe('InvalidProgrammeStatusError', () => {
        it('creates error with status transition', () => {
            const error = new InvalidProgrammeStatusError('DRAFT', 'INVALID');
            expect(error.message).toContain('DRAFT');
            expect(error.message).toContain('INVALID');
            expect(error.code).toBe('INVALID_PROGRAMME_STATUS');
        });
    });

    describe('InvalidProgrammeStatusTransitionError', () => {
        it('creates error with invalid transition', () => {
            const error = new InvalidProgrammeStatusTransitionError('ARCHIVED', 'DRAFT');
            expect(error.message).toContain('ARCHIVED');
            expect(error.message).toContain('DRAFT');
            expect(error.code).toBe('INVALID_PROGRAMME_STATUS_TRANSITION');
        });
    });

    describe('ProgrammeAlreadyPublishedError', () => {
        it('creates error for published programme', () => {
            const error = new ProgrammeAlreadyPublishedError('programme-123');
            expect(error.message).toContain('programme-123');
            expect(error.message).toContain('published');
            expect(error.code).toBe('PROGRAMME_ALREADY_PUBLISHED');
        });
    });

    describe('ProgrammeAlreadyArchivedError', () => {
        it('creates error for archived programme', () => {
            const error = new ProgrammeAlreadyArchivedError('programme-123');
            expect(error.message).toContain('programme-123');
            expect(error.message).toContain('archived');
            expect(error.code).toBe('PROGRAMME_ALREADY_ARCHIVED');
        });
    });

    describe('ProgrammeCannotPublishDraftError', () => {
        it('creates error for unpublishable draft', () => {
            const error = new ProgrammeCannotPublishDraftError('programme-123');
            expect(error.message).toContain('programme-123');
            expect(error.message).toContain('cannot be published');
            expect(error.code).toBe('PROGRAMME_CANNOT_PUBLISH_DRAFT');
        });
    });
});
