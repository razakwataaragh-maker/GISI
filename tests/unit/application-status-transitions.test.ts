import { describe, it, expect } from 'vitest';
import { ApplicationStatus } from '../../src/modules/application/contracts/application';
import {
  validateStatusTransition,
  canModifyApplication,
  validateModification,
  canSubmitApplication,
  canReviewApplication,
  canRequestInformation,
  canDecideApplication,
  validateDecision,
  isTerminalState,
  validateTerminalState,
  getStatusTransitionReason,
} from '../../src/modules/application/domain/application-status-transitions';
import {
  InvalidApplicationStatusError,
  ApplicationModificationNotAllowedError,
  ApplicationDecisionNotAllowedError,
  ApplicationTerminalStateError,
} from '../../src/modules/application/domain/application';

describe('Application Status Transitions', () => {
  describe('validateStatusTransition', () => {
    it('should allow Draft to Submitted', () => {
      expect(() => validateStatusTransition(ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED)).not.toThrow();
    });

    it('should allow Submitted to Under Review', () => {
      expect(() => validateStatusTransition(ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW)).not.toThrow();
    });

    it('should allow Under Review to Information Requested', () => {
      expect(() => validateStatusTransition(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INFORMATION_REQUESTED)).not.toThrow();
    });

    it('should allow Under Review to Approved', () => {
      expect(() => validateStatusTransition(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED)).not.toThrow();
    });

    it('should allow Under Review to Rejected', () => {
      expect(() => validateStatusTransition(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED)).not.toThrow();
    });

    it('should allow Information Requested to Under Review', () => {
      expect(() => validateStatusTransition(ApplicationStatus.INFORMATION_REQUESTED, ApplicationStatus.UNDER_REVIEW)).not.toThrow();
    });

    it('should reject invalid status transition', () => {
      expect(() => validateStatusTransition(ApplicationStatus.DRAFT, ApplicationStatus.APPROVED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Approved to any status', () => {
      expect(() => validateStatusTransition(ApplicationStatus.APPROVED, ApplicationStatus.UNDER_REVIEW)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Rejected to any status', () => {
      expect(() => validateStatusTransition(ApplicationStatus.REJECTED, ApplicationStatus.UNDER_REVIEW)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Submitted to Information Requested', () => {
      expect(() => validateStatusTransition(ApplicationStatus.SUBMITTED, ApplicationStatus.INFORMATION_REQUESTED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Draft to Under Review', () => {
      expect(() => validateStatusTransition(ApplicationStatus.DRAFT, ApplicationStatus.UNDER_REVIEW)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Submitted to Approved', () => {
      expect(() => validateStatusTransition(ApplicationStatus.SUBMITTED, ApplicationStatus.APPROVED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Information Requested to Approved', () => {
      expect(() => validateStatusTransition(ApplicationStatus.INFORMATION_REQUESTED, ApplicationStatus.APPROVED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Information Requested to Rejected', () => {
      expect(() => validateStatusTransition(ApplicationStatus.INFORMATION_REQUESTED, ApplicationStatus.REJECTED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Submitted to Rejected', () => {
      expect(() => validateStatusTransition(ApplicationStatus.SUBMITTED, ApplicationStatus.REJECTED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Draft to Rejected', () => {
      expect(() => validateStatusTransition(ApplicationStatus.DRAFT, ApplicationStatus.REJECTED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Draft to Information Requested', () => {
      expect(() => validateStatusTransition(ApplicationStatus.DRAFT, ApplicationStatus.INFORMATION_REQUESTED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Under Review to Submitted', () => {
      expect(() => validateStatusTransition(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SUBMITTED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Under Review to Draft', () => {
      expect(() => validateStatusTransition(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.DRAFT)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Submitted to Draft', () => {
      expect(() => validateStatusTransition(ApplicationStatus.SUBMITTED, ApplicationStatus.DRAFT)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Information Requested to Draft', () => {
      expect(() => validateStatusTransition(ApplicationStatus.INFORMATION_REQUESTED, ApplicationStatus.DRAFT)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Information Requested to Submitted', () => {
      expect(() => validateStatusTransition(ApplicationStatus.INFORMATION_REQUESTED, ApplicationStatus.SUBMITTED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Approved to Rejected', () => {
      expect(() => validateStatusTransition(ApplicationStatus.APPROVED, ApplicationStatus.REJECTED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Rejected to Approved', () => {
      expect(() => validateStatusTransition(ApplicationStatus.REJECTED, ApplicationStatus.APPROVED)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Approved to Draft', () => {
      expect(() => validateStatusTransition(ApplicationStatus.APPROVED, ApplicationStatus.DRAFT)).toThrow(InvalidApplicationStatusError);
    });

    it('should reject transition from Rejected to Draft', () => {
      expect(() => validateStatusTransition(ApplicationStatus.REJECTED, ApplicationStatus.DRAFT)).toThrow(InvalidApplicationStatusError);
    });
  });

  describe('canModifyApplication', () => {
    it('should allow modification for Draft status', () => {
      expect(canModifyApplication(ApplicationStatus.DRAFT)).toBe(true);
    });

    it('should not allow modification for Submitted status', () => {
      expect(canModifyApplication(ApplicationStatus.SUBMITTED)).toBe(false);
    });

    it('should not allow modification for Under Review status', () => {
      expect(canModifyApplication(ApplicationStatus.UNDER_REVIEW)).toBe(false);
    });

    it('should not allow modification for Information Requested status', () => {
      expect(canModifyApplication(ApplicationStatus.INFORMATION_REQUESTED)).toBe(false);
    });

    it('should not allow modification for Approved status', () => {
      expect(canModifyApplication(ApplicationStatus.APPROVED)).toBe(false);
    });

    it('should not allow modification for Rejected status', () => {
      expect(canModifyApplication(ApplicationStatus.REJECTED)).toBe(false);
    });
  });

  describe('validateModification', () => {
    it('should allow modification for Draft status', () => {
      expect(() => validateModification(ApplicationStatus.DRAFT)).not.toThrow();
    });

    it('should throw error for Submitted status', () => {
      expect(() => validateModification(ApplicationStatus.SUBMITTED)).toThrow(ApplicationModificationNotAllowedError);
    });

    it('should throw error for Under Review status', () => {
      expect(() => validateModification(ApplicationStatus.UNDER_REVIEW)).toThrow(ApplicationModificationNotAllowedError);
    });

    it('should throw error for Information Requested status', () => {
      expect(() => validateModification(ApplicationStatus.INFORMATION_REQUESTED)).toThrow(ApplicationModificationNotAllowedError);
    });

    it('should throw error for Approved status', () => {
      expect(() => validateModification(ApplicationStatus.APPROVED)).toThrow(ApplicationModificationNotAllowedError);
    });

    it('should throw error for Rejected status', () => {
      expect(() => validateModification(ApplicationStatus.REJECTED)).toThrow(ApplicationModificationNotAllowedError);
    });
  });

  describe('canSubmitApplication', () => {
    it('should allow submission for Draft status', () => {
      expect(canSubmitApplication(ApplicationStatus.DRAFT)).toBe(true);
    });

    it('should not allow submission for Submitted status', () => {
      expect(canSubmitApplication(ApplicationStatus.SUBMITTED)).toBe(false);
    });

    it('should not allow submission for Under Review status', () => {
      expect(canSubmitApplication(ApplicationStatus.UNDER_REVIEW)).toBe(false);
    });

    it('should not allow submission for Information Requested status', () => {
      expect(canSubmitApplication(ApplicationStatus.INFORMATION_REQUESTED)).toBe(false);
    });

    it('should not allow submission for Approved status', () => {
      expect(canSubmitApplication(ApplicationStatus.APPROVED)).toBe(false);
    });

    it('should not allow submission for Rejected status', () => {
      expect(canSubmitApplication(ApplicationStatus.REJECTED)).toBe(false);
    });
  });

  describe('canReviewApplication', () => {
    it('should allow review for Submitted status', () => {
      expect(canReviewApplication(ApplicationStatus.SUBMITTED)).toBe(true);
    });

    it('should allow review for Under Review status', () => {
      expect(canReviewApplication(ApplicationStatus.UNDER_REVIEW)).toBe(true);
    });

    it('should not allow review for Draft status', () => {
      expect(canReviewApplication(ApplicationStatus.DRAFT)).toBe(false);
    });

    it('should not allow review for Information Requested status', () => {
      expect(canReviewApplication(ApplicationStatus.INFORMATION_REQUESTED)).toBe(false);
    });

    it('should not allow review for Approved status', () => {
      expect(canReviewApplication(ApplicationStatus.APPROVED)).toBe(false);
    });

    it('should not allow review for Rejected status', () => {
      expect(canReviewApplication(ApplicationStatus.REJECTED)).toBe(false);
    });
  });

  describe('canRequestInformation', () => {
    it('should allow information request for Submitted status', () => {
      expect(canRequestInformation(ApplicationStatus.SUBMITTED)).toBe(true);
    });

    it('should allow information request for Under Review status', () => {
      expect(canRequestInformation(ApplicationStatus.UNDER_REVIEW)).toBe(true);
    });

    it('should allow information request for Information Requested status', () => {
      expect(canRequestInformation(ApplicationStatus.INFORMATION_REQUESTED)).toBe(true);
    });

    it('should not allow information request for Draft status', () => {
      expect(canRequestInformation(ApplicationStatus.DRAFT)).toBe(false);
    });

    it('should not allow information request for Approved status', () => {
      expect(canRequestInformation(ApplicationStatus.APPROVED)).toBe(false);
    });

    it('should not allow information request for Rejected status', () => {
      expect(canRequestInformation(ApplicationStatus.REJECTED)).toBe(false);
    });
  });

  describe('canDecideApplication', () => {
    it('should allow decision for Under Review status', () => {
      expect(canDecideApplication(ApplicationStatus.UNDER_REVIEW)).toBe(true);
    });

    it('should not allow decision for Draft status', () => {
      expect(canDecideApplication(ApplicationStatus.DRAFT)).toBe(false);
    });

    it('should not allow decision for Submitted status', () => {
      expect(canDecideApplication(ApplicationStatus.SUBMITTED)).toBe(false);
    });

    it('should not allow decision for Information Requested status', () => {
      expect(canDecideApplication(ApplicationStatus.INFORMATION_REQUESTED)).toBe(false);
    });

    it('should not allow decision for Approved status', () => {
      expect(canDecideApplication(ApplicationStatus.APPROVED)).toBe(false);
    });

    it('should not allow decision for Rejected status', () => {
      expect(canDecideApplication(ApplicationStatus.REJECTED)).toBe(false);
    });
  });

  describe('validateDecision', () => {
    it('should allow decision for Under Review status', () => {
      expect(() => validateDecision(ApplicationStatus.UNDER_REVIEW)).not.toThrow();
    });

    it('should throw error for Draft status', () => {
      expect(() => validateDecision(ApplicationStatus.DRAFT)).toThrow(ApplicationDecisionNotAllowedError);
    });

    it('should throw error for Submitted status', () => {
      expect(() => validateDecision(ApplicationStatus.SUBMITTED)).toThrow(ApplicationDecisionNotAllowedError);
    });

    it('should throw error for Information Requested status', () => {
      expect(() => validateDecision(ApplicationStatus.INFORMATION_REQUESTED)).toThrow(ApplicationDecisionNotAllowedError);
    });

    it('should throw error for Approved status', () => {
      expect(() => validateDecision(ApplicationStatus.APPROVED)).toThrow(ApplicationDecisionNotAllowedError);
    });

    it('should throw error for Rejected status', () => {
      expect(() => validateDecision(ApplicationStatus.REJECTED)).toThrow(ApplicationDecisionNotAllowedError);
    });
  });

  describe('isTerminalState', () => {
    it('should identify Approved as terminal state', () => {
      expect(isTerminalState(ApplicationStatus.APPROVED)).toBe(true);
    });

    it('should identify Rejected as terminal state', () => {
      expect(isTerminalState(ApplicationStatus.REJECTED)).toBe(true);
    });

    it('should not identify Draft as terminal state', () => {
      expect(isTerminalState(ApplicationStatus.DRAFT)).toBe(false);
    });

    it('should not identify Submitted as terminal state', () => {
      expect(isTerminalState(ApplicationStatus.SUBMITTED)).toBe(false);
    });

    it('should not identify Under Review as terminal state', () => {
      expect(isTerminalState(ApplicationStatus.UNDER_REVIEW)).toBe(false);
    });

    it('should not identify Information Requested as terminal state', () => {
      expect(isTerminalState(ApplicationStatus.INFORMATION_REQUESTED)).toBe(false);
    });
  });

  describe('validateTerminalState', () => {
    it('should throw error for Approved status', () => {
      expect(() => validateTerminalState(ApplicationStatus.APPROVED)).toThrow(ApplicationTerminalStateError);
    });

    it('should throw error for Rejected status', () => {
      expect(() => validateTerminalState(ApplicationStatus.REJECTED)).toThrow(ApplicationTerminalStateError);
    });

    it('should not throw error for Draft status', () => {
      expect(() => validateTerminalState(ApplicationStatus.DRAFT)).not.toThrow();
    });

    it('should not throw error for Submitted status', () => {
      expect(() => validateTerminalState(ApplicationStatus.SUBMITTED)).not.toThrow();
    });

    it('should not throw error for Under Review status', () => {
      expect(() => validateTerminalState(ApplicationStatus.UNDER_REVIEW)).not.toThrow();
    });

    it('should not throw error for Information Requested status', () => {
      expect(() => validateTerminalState(ApplicationStatus.INFORMATION_REQUESTED)).not.toThrow();
    });
  });

  describe('getStatusTransitionReason', () => {
    it('should return reason for Draft to Submitted', () => {
      const reason = getStatusTransitionReason(ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED);
      expect(reason).toBe('Application submitted for review');
    });

    it('should return reason for Submitted to Under Review', () => {
      const reason = getStatusTransitionReason(ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW);
      expect(reason).toBe('Application assigned for review');
    });

    it('should return reason for Under Review to Information Requested', () => {
      const reason = getStatusTransitionReason(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INFORMATION_REQUESTED);
      expect(reason).toBe('Additional information requested');
    });

    it('should return reason for Information Requested to Under Review', () => {
      const reason = getStatusTransitionReason(ApplicationStatus.INFORMATION_REQUESTED, ApplicationStatus.UNDER_REVIEW);
      expect(reason).toBe('Information provided, review resumed');
    });

    it('should return reason for Under Review to Approved', () => {
      const reason = getStatusTransitionReason(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED);
      expect(reason).toBe('Application approved');
    });

    it('should return reason for Under Review to Rejected', () => {
      const reason = getStatusTransitionReason(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED);
      expect(reason).toBe('Application rejected');
    });

    it('should return generic reason for unknown transition', () => {
      const reason = getStatusTransitionReason(ApplicationStatus.DRAFT, ApplicationStatus.UNDER_REVIEW);
      expect(reason).toBe('Status changed from DRAFT to UNDER_REVIEW');
    });
  });
});
