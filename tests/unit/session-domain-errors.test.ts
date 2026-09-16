import { describe, expect, it } from 'vitest';
import {
    InvalidSessionDatesError,
    InvalidSessionStatusError,
    InvalidSessionStatusTransitionError,
    InvalidSessionWindowError,
    SessionAlreadyArchivedError,
    SessionAlreadyClosedError,
    SessionAlreadyOpenError,
    SessionCannotCloseError,
    SessionCannotOpenError,
    SessionNotFoundError,
} from '../../src/modules/session/domain/session.js';

describe('Session Domain Errors', () => {
    describe('SessionNotFoundError', () => {
        it('creates error with session ID', () => {
            const error = new SessionNotFoundError('session-123');
            expect(error.message).toContain('session-123');
            expect(error.code).toBe('SESSION_NOT_FOUND');
        });
    });

    describe('InvalidSessionDatesError', () => {
        it('creates error with date validation message', () => {
            const error = new InvalidSessionDatesError('Start date must be before end date');
            expect(error.message).toContain('Start date must be before end date');
            expect(error.code).toBe('INVALID_SESSION_DATES');
        });
    });

    describe('InvalidSessionWindowError', () => {
        it('creates error with window validation message', () => {
            const error = new InvalidSessionWindowError('Application window start must be within session dates');
            expect(error.message).toContain('Application window start must be within session dates');
            expect(error.code).toBe('INVALID_SESSION_WINDOW');
        });
    });

    describe('InvalidSessionStatusError', () => {
        it('creates error with status transition', () => {
            const error = new InvalidSessionStatusError('DRAFT', 'INVALID');
            expect(error.message).toContain('DRAFT');
            expect(error.message).toContain('INVALID');
            expect(error.code).toBe('INVALID_SESSION_STATUS');
        });
    });

    describe('InvalidSessionStatusTransitionError', () => {
        it('creates error with invalid transition', () => {
            const error = new InvalidSessionStatusTransitionError('ARCHIVED', 'DRAFT');
            expect(error.message).toContain('ARCHIVED');
            expect(error.message).toContain('DRAFT');
            expect(error.code).toBe('INVALID_SESSION_STATUS_TRANSITION');
        });
    });

    describe('SessionAlreadyOpenError', () => {
        it('creates error for open session', () => {
            const error = new SessionAlreadyOpenError('session-123');
            expect(error.message).toContain('session-123');
            expect(error.message).toContain('already open');
            expect(error.code).toBe('SESSION_ALREADY_OPEN');
        });
    });

    describe('SessionAlreadyClosedError', () => {
        it('creates error for closed session', () => {
            const error = new SessionAlreadyClosedError('session-123');
            expect(error.message).toContain('session-123');
            expect(error.message).toContain('already closed');
            expect(error.code).toBe('SESSION_ALREADY_CLOSED');
        });
    });

    describe('SessionAlreadyArchivedError', () => {
        it('creates error for archived session', () => {
            const error = new SessionAlreadyArchivedError('session-123');
            expect(error.message).toContain('session-123');
            expect(error.message).toContain('archived');
            expect(error.code).toBe('SESSION_ALREADY_ARCHIVED');
        });
    });

    describe('SessionCannotOpenError', () => {
        it('creates error with reason', () => {
            const error = new SessionCannotOpenError('session-123', 'Application window is required');
            expect(error.message).toContain('session-123');
            expect(error.message).toContain('cannot be opened');
            expect(error.message).toContain('Application window is required');
            expect(error.code).toBe('SESSION_CANNOT_OPEN');
        });
    });

    describe('SessionCannotCloseError', () => {
        it('creates error with reason', () => {
            const error = new SessionCannotCloseError('session-123', 'Session is not open');
            expect(error.message).toContain('session-123');
            expect(error.message).toContain('cannot be closed');
            expect(error.message).toContain('Session is not open');
            expect(error.code).toBe('SESSION_CANNOT_CLOSE');
        });
    });
});
