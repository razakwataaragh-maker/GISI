import { describe, it, expect } from 'vitest';
import { AdmissionStatus } from '../../src/modules/admission/contracts/admission';
import {
  validateStatusTransition,
  canAcceptAdmission,
  canDeferAdmission,
  canDeclineAdmission,
  canExpireAdmission,
  validateAcceptance,
  validateDeferral,
  validateDecline,
  isTerminalState,
  validateTerminalState,
  getStatusTransitionReason,
} from '../../src/modules/admission/domain/admission-status-transitions';
import {
  InvalidAdmissionStatusError,
  AdmissionActionNotAllowedError,
  AdmissionTerminalStateError,
} from '../../src/modules/admission/domain/admission';

describe('Admission Status Transitions', () => {
  describe('validateStatusTransition', () => {
    it('should allow Offered to Accepted', () => {
      expect(() => validateStatusTransition(AdmissionStatus.OFFERED, AdmissionStatus.ACCEPTED)).not.toThrow();
    });

    it('should allow Offered to Declined', () => {
      expect(() => validateStatusTransition(AdmissionStatus.OFFERED, AdmissionStatus.DECLINED)).not.toThrow();
    });

    it('should allow Offered to Deferred', () => {
      expect(() => validateStatusTransition(AdmissionStatus.OFFERED, AdmissionStatus.DEFERRED)).not.toThrow();
    });

    it('should allow Deferred to Accepted', () => {
      expect(() => validateStatusTransition(AdmissionStatus.DEFERRED, AdmissionStatus.ACCEPTED)).not.toThrow();
    });

    it('should allow Deferred to Declined', () => {
      expect(() => validateStatusTransition(AdmissionStatus.DEFERRED, AdmissionStatus.DECLINED)).not.toThrow();
    });

    it('should allow Deferred to Expired', () => {
      expect(() => validateStatusTransition(AdmissionStatus.DEFERRED, AdmissionStatus.EXPIRED)).not.toThrow();
    });

    it('should reject invalid status transition', () => {
      expect(() => validateStatusTransition(AdmissionStatus.OFFERED, AdmissionStatus.EXPIRED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Accepted to any status', () => {
      expect(() => validateStatusTransition(AdmissionStatus.ACCEPTED, AdmissionStatus.DECLINED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Declined to any status', () => {
      expect(() => validateStatusTransition(AdmissionStatus.DECLINED, AdmissionStatus.ACCEPTED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Expired to any status', () => {
      expect(() => validateStatusTransition(AdmissionStatus.EXPIRED, AdmissionStatus.ACCEPTED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Deferred to Offered', () => {
      expect(() => validateStatusTransition(AdmissionStatus.DEFERRED, AdmissionStatus.OFFERED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Accepted to Deferred', () => {
      expect(() => validateStatusTransition(AdmissionStatus.ACCEPTED, AdmissionStatus.DEFERRED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Declined to Deferred', () => {
      expect(() => validateStatusTransition(AdmissionStatus.DECLINED, AdmissionStatus.DEFERRED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Expired to Deferred', () => {
      expect(() => validateStatusTransition(AdmissionStatus.EXPIRED, AdmissionStatus.DEFERRED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Accepted to Offered', () => {
      expect(() => validateStatusTransition(AdmissionStatus.ACCEPTED, AdmissionStatus.OFFERED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Declined to Offered', () => {
      expect(() => validateStatusTransition(AdmissionStatus.DECLINED, AdmissionStatus.OFFERED)).toThrow(InvalidAdmissionStatusError);
    });

    it('should reject transition from Expired to Offered', () => {
      expect(() => validateStatusTransition(AdmissionStatus.EXPIRED, AdmissionStatus.OFFERED)).toThrow(InvalidAdmissionStatusError);
    });
  });

  describe('canAcceptAdmission', () => {
    it('should allow acceptance for Offered status', () => {
      expect(canAcceptAdmission(AdmissionStatus.OFFERED)).toBe(true);
    });

    it('should allow acceptance for Deferred status', () => {
      expect(canAcceptAdmission(AdmissionStatus.DEFERRED)).toBe(true);
    });

    it('should not allow acceptance for Accepted status', () => {
      expect(canAcceptAdmission(AdmissionStatus.ACCEPTED)).toBe(false);
    });

    it('should not allow acceptance for Declined status', () => {
      expect(canAcceptAdmission(AdmissionStatus.DECLINED)).toBe(false);
    });

    it('should not allow acceptance for Expired status', () => {
      expect(canAcceptAdmission(AdmissionStatus.EXPIRED)).toBe(false);
    });
  });

  describe('canDeferAdmission', () => {
    it('should allow deferral for Offered status', () => {
      expect(canDeferAdmission(AdmissionStatus.OFFERED)).toBe(true);
    });

    it('should not allow deferral for Deferred status', () => {
      expect(canDeferAdmission(AdmissionStatus.DEFERRED)).toBe(false);
    });

    it('should not allow deferral for Accepted status', () => {
      expect(canDeferAdmission(AdmissionStatus.ACCEPTED)).toBe(false);
    });

    it('should not allow deferral for Declined status', () => {
      expect(canDeferAdmission(AdmissionStatus.DECLINED)).toBe(false);
    });

    it('should not allow deferral for Expired status', () => {
      expect(canDeferAdmission(AdmissionStatus.EXPIRED)).toBe(false);
    });
  });

  describe('canDeclineAdmission', () => {
    it('should allow decline for Offered status', () => {
      expect(canDeclineAdmission(AdmissionStatus.OFFERED)).toBe(true);
    });

    it('should allow decline for Deferred status', () => {
      expect(canDeclineAdmission(AdmissionStatus.DEFERRED)).toBe(true);
    });

    it('should not allow decline for Accepted status', () => {
      expect(canDeclineAdmission(AdmissionStatus.ACCEPTED)).toBe(false);
    });

    it('should not allow decline for Declined status', () => {
      expect(canDeclineAdmission(AdmissionStatus.DECLINED)).toBe(false);
    });

    it('should not allow decline for Expired status', () => {
      expect(canDeclineAdmission(AdmissionStatus.EXPIRED)).toBe(false);
    });
  });

  describe('canExpireAdmission', () => {
    it('should allow expiration for Deferred status', () => {
      expect(canExpireAdmission(AdmissionStatus.DEFERRED)).toBe(true);
    });

    it('should not allow expiration for Offered status', () => {
      expect(canExpireAdmission(AdmissionStatus.OFFERED)).toBe(false);
    });

    it('should not allow expiration for Accepted status', () => {
      expect(canExpireAdmission(AdmissionStatus.ACCEPTED)).toBe(false);
    });

    it('should not allow expiration for Declined status', () => {
      expect(canExpireAdmission(AdmissionStatus.DECLINED)).toBe(false);
    });

    it('should not allow expiration for Expired status', () => {
      expect(canExpireAdmission(AdmissionStatus.EXPIRED)).toBe(false);
    });
  });

  describe('validateAcceptance', () => {
    it('should allow acceptance for Offered status', () => {
      expect(() => validateAcceptance(AdmissionStatus.OFFERED)).not.toThrow();
    });

    it('should allow acceptance for Deferred status', () => {
      expect(() => validateAcceptance(AdmissionStatus.DEFERRED)).not.toThrow();
    });

    it('should throw error for Accepted status', () => {
      expect(() => validateAcceptance(AdmissionStatus.ACCEPTED)).toThrow(AdmissionActionNotAllowedError);
    });

    it('should throw error for Declined status', () => {
      expect(() => validateAcceptance(AdmissionStatus.DECLINED)).toThrow(AdmissionActionNotAllowedError);
    });

    it('should throw error for Expired status', () => {
      expect(() => validateAcceptance(AdmissionStatus.EXPIRED)).toThrow(AdmissionActionNotAllowedError);
    });
  });

  describe('validateDeferral', () => {
    it('should allow deferral for Offered status', () => {
      expect(() => validateDeferral(AdmissionStatus.OFFERED)).not.toThrow();
    });

    it('should throw error for Deferred status', () => {
      expect(() => validateDeferral(AdmissionStatus.DEFERRED)).toThrow(AdmissionActionNotAllowedError);
    });

    it('should throw error for Accepted status', () => {
      expect(() => validateDeferral(AdmissionStatus.ACCEPTED)).toThrow(AdmissionActionNotAllowedError);
    });

    it('should throw error for Declined status', () => {
      expect(() => validateDeferral(AdmissionStatus.DECLINED)).toThrow(AdmissionActionNotAllowedError);
    });

    it('should throw error for Expired status', () => {
      expect(() => validateDeferral(AdmissionStatus.EXPIRED)).toThrow(AdmissionActionNotAllowedError);
    });
  });

  describe('validateDecline', () => {
    it('should allow decline for Offered status', () => {
      expect(() => validateDecline(AdmissionStatus.OFFERED)).not.toThrow();
    });

    it('should allow decline for Deferred status', () => {
      expect(() => validateDecline(AdmissionStatus.DEFERRED)).not.toThrow();
    });

    it('should throw error for Accepted status', () => {
      expect(() => validateDecline(AdmissionStatus.ACCEPTED)).toThrow(AdmissionActionNotAllowedError);
    });

    it('should throw error for Declined status', () => {
      expect(() => validateDecline(AdmissionStatus.DECLINED)).toThrow(AdmissionActionNotAllowedError);
    });

    it('should throw error for Expired status', () => {
      expect(() => validateDecline(AdmissionStatus.EXPIRED)).toThrow(AdmissionActionNotAllowedError);
    });
  });

  describe('isTerminalState', () => {
    it('should identify Accepted as terminal state', () => {
      expect(isTerminalState(AdmissionStatus.ACCEPTED)).toBe(true);
    });

    it('should identify Declined as terminal state', () => {
      expect(isTerminalState(AdmissionStatus.DECLINED)).toBe(true);
    });

    it('should identify Expired as terminal state', () => {
      expect(isTerminalState(AdmissionStatus.EXPIRED)).toBe(true);
    });

    it('should not identify Offered as terminal state', () => {
      expect(isTerminalState(AdmissionStatus.OFFERED)).toBe(false);
    });

    it('should not identify Deferred as terminal state', () => {
      expect(isTerminalState(AdmissionStatus.DEFERRED)).toBe(false);
    });
  });

  describe('validateTerminalState', () => {
    it('should throw error for Accepted status', () => {
      expect(() => validateTerminalState(AdmissionStatus.ACCEPTED)).toThrow(AdmissionTerminalStateError);
    });

    it('should throw error for Declined status', () => {
      expect(() => validateTerminalState(AdmissionStatus.DECLINED)).toThrow(AdmissionTerminalStateError);
    });

    it('should throw error for Expired status', () => {
      expect(() => validateTerminalState(AdmissionStatus.EXPIRED)).toThrow(AdmissionTerminalStateError);
    });

    it('should not throw error for Offered status', () => {
      expect(() => validateTerminalState(AdmissionStatus.OFFERED)).not.toThrow();
    });

    it('should not throw error for Deferred status', () => {
      expect(() => validateTerminalState(AdmissionStatus.DEFERRED)).not.toThrow();
    });
  });

  describe('getStatusTransitionReason', () => {
    it('should return reason for Offered to Accepted', () => {
      const reason = getStatusTransitionReason(AdmissionStatus.OFFERED, AdmissionStatus.ACCEPTED);
      expect(reason).toBe('Admission accepted');
    });

    it('should return reason for Offered to Declined', () => {
      const reason = getStatusTransitionReason(AdmissionStatus.OFFERED, AdmissionStatus.DECLINED);
      expect(reason).toBe('Admission declined');
    });

    it('should return reason for Offered to Deferred', () => {
      const reason = getStatusTransitionReason(AdmissionStatus.OFFERED, AdmissionStatus.DEFERRED);
      expect(reason).toBe('Admission deferred');
    });

    it('should return reason for Deferred to Accepted', () => {
      const reason = getStatusTransitionReason(AdmissionStatus.DEFERRED, AdmissionStatus.ACCEPTED);
      expect(reason).toBe('Deferred admission accepted');
    });

    it('should return reason for Deferred to Declined', () => {
      const reason = getStatusTransitionReason(AdmissionStatus.DEFERRED, AdmissionStatus.DECLINED);
      expect(reason).toBe('Deferred admission declined');
    });

    it('should return reason for Deferred to Expired', () => {
      const reason = getStatusTransitionReason(AdmissionStatus.DEFERRED, AdmissionStatus.EXPIRED);
      expect(reason).toBe('Deferred admission expired');
    });

    it('should return generic reason for unknown transition', () => {
      const reason = getStatusTransitionReason(AdmissionStatus.OFFERED, AdmissionStatus.EXPIRED);
      expect(reason).toBe('Status changed from OFFERED to EXPIRED');
    });
  });
});
