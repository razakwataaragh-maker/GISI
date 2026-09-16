import { describe, expect, it } from 'vitest';
import {
    InvalidDocumentTypeError,
    InvalidStudentStatusError,
    InvalidStudentStatusTransitionError,
    StudentAlreadyGraduatedError,
    StudentAlreadyWithdrawnError,
    StudentDocumentNotFoundError,
    StudentNotFoundError,
    StudentNumberAlreadyExistsError,
} from '../../src/modules/student/domain/student.js';

describe('Student Domain Errors', () => {
    describe('StudentNotFoundError', () => {
        it('creates error with student ID', () => {
            const error = new StudentNotFoundError('student-123');
            expect(error.message).toContain('student-123');
            expect(error.code).toBe('STUDENT_NOT_FOUND');
        });
    });

    describe('StudentNumberAlreadyExistsError', () => {
        it('creates error with student number', () => {
            const error = new StudentNumberAlreadyExistsError('STU00000001');
            expect(error.message).toContain('STU00000001');
            expect(error.code).toBe('STUDENT_NUMBER_ALREADY_EXISTS');
        });
    });

    describe('InvalidStudentStatusError', () => {
        it('creates error with status transition', () => {
            const error = new InvalidStudentStatusError('ACTIVE', 'INVALID');
            expect(error.message).toContain('ACTIVE');
            expect(error.message).toContain('INVALID');
            expect(error.code).toBe('INVALID_STUDENT_STATUS');
        });
    });

    describe('InvalidStudentStatusTransitionError', () => {
        it('creates error with invalid transition', () => {
            const error = new InvalidStudentStatusTransitionError('GRADUATED', 'ACTIVE');
            expect(error.message).toContain('GRADUATED');
            expect(error.message).toContain('ACTIVE');
            expect(error.code).toBe('INVALID_STUDENT_STATUS_TRANSITION');
        });
    });

    describe('StudentAlreadyGraduatedError', () => {
        it('creates error for graduated student', () => {
            const error = new StudentAlreadyGraduatedError('student-123');
            expect(error.message).toContain('student-123');
            expect(error.message).toContain('graduated');
            expect(error.code).toBe('STUDENT_ALREADY_GRADUATED');
        });
    });

    describe('StudentAlreadyWithdrawnError', () => {
        it('creates error for withdrawn student', () => {
            const error = new StudentAlreadyWithdrawnError('student-123');
            expect(error.message).toContain('student-123');
            expect(error.message).toContain('withdrawn');
            expect(error.code).toBe('STUDENT_ALREADY_WITHDRAWN');
        });
    });

    describe('StudentDocumentNotFoundError', () => {
        it('creates error with document ID', () => {
            const error = new StudentDocumentNotFoundError('doc-123');
            expect(error.message).toContain('doc-123');
            expect(error.code).toBe('STUDENT_DOCUMENT_NOT_FOUND');
        });
    });

    describe('InvalidDocumentTypeError', () => {
        it('creates error with document type', () => {
            const error = new InvalidDocumentTypeError('invalid_type');
            expect(error.message).toContain('invalid_type');
            expect(error.code).toBe('INVALID_DOCUMENT_TYPE');
        });
    });
});
