import { ApplicationStatus } from '../contracts/application';
import {
  InvalidApplicationStatusError,
  ApplicationModificationNotAllowedError,
  ApplicationDecisionNotAllowedError,
  ApplicationTerminalStateError,
} from './application';

export function validateStatusTransition(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus,
): void {
  const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.DRAFT]: [ApplicationStatus.SUBMITTED],
    [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW],
    [ApplicationStatus.UNDER_REVIEW]: [
      ApplicationStatus.INFORMATION_REQUESTED,
      ApplicationStatus.APPROVED,
      ApplicationStatus.REJECTED,
    ],
    [ApplicationStatus.INFORMATION_REQUESTED]: [ApplicationStatus.UNDER_REVIEW],
    [ApplicationStatus.APPROVED]: [],
    [ApplicationStatus.REJECTED]: [],
  };

  const allowedTransitions = validTransitions[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
    throw new InvalidApplicationStatusError(currentStatus, targetStatus);
  }
}

export function canModifyApplication(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.DRAFT;
}

export function validateModification(status: ApplicationStatus): void {
  if (!canModifyApplication(status)) {
    throw new ApplicationModificationNotAllowedError(status);
  }
}

export function canSubmitApplication(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.DRAFT;
}

export function canReviewApplication(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.UNDER_REVIEW;
}

export function canRequestInformation(status: ApplicationStatus): boolean {
  return (
    status === ApplicationStatus.SUBMITTED ||
    status === ApplicationStatus.UNDER_REVIEW ||
    status === ApplicationStatus.INFORMATION_REQUESTED
  );
}

export function canDecideApplication(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.UNDER_REVIEW;
}

export function validateDecision(status: ApplicationStatus): void {
  if (!canDecideApplication(status)) {
    throw new ApplicationDecisionNotAllowedError(status);
  }
}

export function isTerminalState(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.APPROVED || status === ApplicationStatus.REJECTED;
}

export function validateTerminalState(status: ApplicationStatus): void {
  if (isTerminalState(status)) {
    throw new ApplicationTerminalStateError(status);
  }
}

export function getStatusTransitionReason(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus,
): string {
  const reasonMap: Record<string, string> = {
    [`${ApplicationStatus.DRAFT}->${ApplicationStatus.SUBMITTED}`]: 'Application submitted for review',
    [`${ApplicationStatus.SUBMITTED}->${ApplicationStatus.UNDER_REVIEW}`]: 'Application assigned for review',
    [`${ApplicationStatus.UNDER_REVIEW}->${ApplicationStatus.INFORMATION_REQUESTED}`]: 'Additional information requested',
    [`${ApplicationStatus.INFORMATION_REQUESTED}->${ApplicationStatus.UNDER_REVIEW}`]: 'Information provided, review resumed',
    [`${ApplicationStatus.UNDER_REVIEW}->${ApplicationStatus.APPROVED}`]: 'Application approved',
    [`${ApplicationStatus.UNDER_REVIEW}->${ApplicationStatus.REJECTED}`]: 'Application rejected',
  };

  const key = `${currentStatus}->${targetStatus}`;
  return reasonMap[key] || `Status changed from ${currentStatus} to ${targetStatus}`;
}
