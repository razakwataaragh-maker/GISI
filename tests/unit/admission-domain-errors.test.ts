import { describe, it, expect } from 'vitest';
import {
  AdmissionNotFoundError,
  InvalidAdmissionStatusError,
  AdmissionActionNotAllowedError,
  AdmissionDeadlineExpiredError,
  AdmissionAlreadyExistsError,
  ApplicationNotApprovedError,
  DeferralNotAllowedError,
  AdmissionTerminalStateError,
} from '../../src/modules/admission/domain/admission';

describe('Admission Domain Errors', () => {
  describe('AdmissionNotFoundError', () => {
    it('should create error with admission ID', () => {
      const error = new AdmissionNotFoundError('adm-123');
      expect(error.message).toBe('Admission not found: adm-123');
      expect(error.name).toBe('AdmissionNotFoundError');
    });
  });

  describe('InvalidAdmissionStatusError', () => {
    it('should create error with status transition', () => {
      const error = new InvalidAdmissionStatusError('OFFERED', 'EXPIRED');
      expect(error.message).toBe('Invalid status transition from OFFERED to EXPIRED');
      expect(error.name).toBe('InvalidAdmissionStatusError');
    });
  });

  describe('AdmissionActionNotAllowedError', () => {
    it('should create error with status and action', () => {
      const error = new AdmissionActionNotAllowedError('ACCEPTED', 'deferral');
      expect(error.message).toBe('Admission deferral not allowed in status: ACCEPTED');
      expect(error.name).toBe('AdmissionActionNotAllowedError');
    });
  });

  describe('AdmissionDeadlineExpiredError', () => {
    it('should create error with admission ID', () => {
      const error = new AdmissionDeadlineExpiredError('adm-123');
      expect(error.message).toBe('Admission deadline has expired: adm-123');
      expect(error.name).toBe('AdmissionDeadlineExpiredError');
    });
  });

  describe('AdmissionAlreadyExistsError', () => {
    it('should create error with application ID', () => {
      const error = new AdmissionAlreadyExistsError('app-123');
      expect(error.message).toBe('Admission already exists for application: app-123');
      expect(error.name).toBe('AdmissionAlreadyExistsError');
    });
  });

  describe('ApplicationNotApprovedError', () => {
    it('should create error with application ID', () => {
      const error = new ApplicationNotApprovedError('app-123');
      expect(error.message).toBe('Application is not approved: app-123');
      expect(error.name).toBe('ApplicationNotApprovedError');
    });
  });

  describe('DeferralNotAllowedError', () => {
    it('should create error with reason', () => {
      const error = new DeferralNotAllowedError('Deferral end date must be in the future');
      expect(error.message).toBe('Deferral not allowed: Deferral end date must be in the future');
      expect(error.name).toBe('DeferralNotAllowedError');
    });
  });

  describe('AdmissionTerminalStateError', () => {
    it('should create error with status', () => {
      const error = new AdmissionTerminalStateError('ACCEPTED');
      expect(error.message).toBe('Admission is in terminal state: ACCEPTED');
      expect(error.name).toBe('AdmissionTerminalStateError');
    });
  });
});
