import { describe, it, expect } from 'vitest';
import {
  ApplicationNotFoundError,
  InvalidApplicationStatusError,
  ApplicationModificationNotAllowedError,
  ApplicationSubmissionValidationError,
  ApplicationDecisionNotAllowedError,
  ApplicationTerminalStateError,
  InvalidApplicationWindowError,
  ProgrammeNotAcceptingApplicationsError,
  SessionNotOpenForApplicationsError,
  StudentProfileIncompleteError,
  RequiredDocumentsMissingError,
} from '../../src/modules/application/domain/application';

describe('Application Domain Errors', () => {
  describe('ApplicationNotFoundError', () => {
    it('should create error with application ID', () => {
      const error = new ApplicationNotFoundError('app-123');
      expect(error.message).toBe('Application not found: app-123');
      expect(error.name).toBe('ApplicationNotFoundError');
    });
  });

  describe('InvalidApplicationStatusError', () => {
    it('should create error with status transition', () => {
      const error = new InvalidApplicationStatusError('DRAFT', 'APPROVED');
      expect(error.message).toBe('Invalid status transition from DRAFT to APPROVED');
      expect(error.name).toBe('InvalidApplicationStatusError');
    });
  });

  describe('ApplicationModificationNotAllowedError', () => {
    it('should create error with status', () => {
      const error = new ApplicationModificationNotAllowedError('SUBMITTED');
      expect(error.message).toBe('Application modification not allowed in status: SUBMITTED');
      expect(error.name).toBe('ApplicationModificationNotAllowedError');
    });
  });

  describe('ApplicationSubmissionValidationError', () => {
    it('should create error with reason', () => {
      const error = new ApplicationSubmissionValidationError('Missing required documents');
      expect(error.message).toBe('Application submission validation failed: Missing required documents');
      expect(error.name).toBe('ApplicationSubmissionValidationError');
    });
  });

  describe('ApplicationDecisionNotAllowedError', () => {
    it('should create error with status', () => {
      const error = new ApplicationDecisionNotAllowedError('DRAFT');
      expect(error.message).toBe('Application decision not allowed in status: DRAFT');
      expect(error.name).toBe('ApplicationDecisionNotAllowedError');
    });
  });

  describe('ApplicationTerminalStateError', () => {
    it('should create error with status', () => {
      const error = new ApplicationTerminalStateError('APPROVED');
      expect(error.message).toBe('Application is in terminal state: APPROVED');
      expect(error.name).toBe('ApplicationTerminalStateError');
    });
  });

  describe('InvalidApplicationWindowError', () => {
    it('should create error with reason', () => {
      const error = new InvalidApplicationWindowError('Application window is closed');
      expect(error.message).toBe('Application window validation failed: Application window is closed');
      expect(error.name).toBe('InvalidApplicationWindowError');
    });
  });

  describe('ProgrammeNotAcceptingApplicationsError', () => {
    it('should create error with programme ID', () => {
      const error = new ProgrammeNotAcceptingApplicationsError('prog-123');
      expect(error.message).toBe('Programme is not accepting applications: prog-123');
      expect(error.name).toBe('ProgrammeNotAcceptingApplicationsError');
    });
  });

  describe('SessionNotOpenForApplicationsError', () => {
    it('should create error with session ID', () => {
      const error = new SessionNotOpenForApplicationsError('sess-123');
      expect(error.message).toBe('Session is not open for applications: sess-123');
      expect(error.name).toBe('SessionNotOpenForApplicationsError');
    });
  });

  describe('StudentProfileIncompleteError', () => {
    it('should create error with student ID', () => {
      const error = new StudentProfileIncompleteError('student-123');
      expect(error.message).toBe('Student profile is incomplete: student-123');
      expect(error.name).toBe('StudentProfileIncompleteError');
    });
  });

  describe('RequiredDocumentsMissingError', () => {
    it('should create error with application ID', () => {
      const error = new RequiredDocumentsMissingError('app-123');
      expect(error.message).toBe('Required documents are missing for application: app-123');
      expect(error.name).toBe('RequiredDocumentsMissingError');
    });
  });
});
