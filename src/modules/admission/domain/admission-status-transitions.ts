import { AdmissionStatus } from '../contracts/admission';
import {
  InvalidAdmissionStatusError,
  AdmissionActionNotAllowedError,
  AdmissionTerminalStateError,
} from './admission';

export function validateStatusTransition(
  currentStatus: AdmissionStatus,
  targetStatus: AdmissionStatus,
): void {
  const validTransitions: Record<AdmissionStatus, AdmissionStatus[]> = {
    [AdmissionStatus.OFFERED]: [AdmissionStatus.ACCEPTED, AdmissionStatus.DECLINED, AdmissionStatus.DEFERRED],
    [AdmissionStatus.DEFERRED]: [AdmissionStatus.ACCEPTED, AdmissionStatus.DECLINED, AdmissionStatus.EXPIRED],
    [AdmissionStatus.ACCEPTED]: [],
    [AdmissionStatus.DECLINED]: [],
    [AdmissionStatus.EXPIRED]: [],
  };

  const allowedTransitions = validTransitions[currentStatus];
  if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
    throw new InvalidAdmissionStatusError(currentStatus, targetStatus);
  }
}

export function canAcceptAdmission(status: AdmissionStatus): boolean {
  return status === AdmissionStatus.OFFERED || status === AdmissionStatus.DEFERRED;
}

export function canDeferAdmission(status: AdmissionStatus): boolean {
  return status === AdmissionStatus.OFFERED;
}

export function canDeclineAdmission(status: AdmissionStatus): boolean {
  return status === AdmissionStatus.OFFERED || status === AdmissionStatus.DEFERRED;
}

export function canExpireAdmission(status: AdmissionStatus): boolean {
  return status === AdmissionStatus.DEFERRED;
}

export function validateAcceptance(status: AdmissionStatus): void {
  if (!canAcceptAdmission(status)) {
    throw new AdmissionActionNotAllowedError(status, 'acceptance');
  }
}

export function validateDeferral(status: AdmissionStatus): void {
  if (!canDeferAdmission(status)) {
    throw new AdmissionActionNotAllowedError(status, 'deferral');
  }
}

export function validateDecline(status: AdmissionStatus): void {
  if (!canDeclineAdmission(status)) {
    throw new AdmissionActionNotAllowedError(status, 'decline');
  }
}

export function isTerminalState(status: AdmissionStatus): boolean {
  return status === AdmissionStatus.ACCEPTED || status === AdmissionStatus.DECLINED || status === AdmissionStatus.EXPIRED;
}

export function validateTerminalState(status: AdmissionStatus): void {
  if (isTerminalState(status)) {
    throw new AdmissionTerminalStateError(status);
  }
}

export function getStatusTransitionReason(
  currentStatus: AdmissionStatus,
  targetStatus: AdmissionStatus,
): string {
  const reasonMap: Record<string, string> = {
    [`${AdmissionStatus.OFFERED}->${AdmissionStatus.ACCEPTED}`]: 'Admission accepted',
    [`${AdmissionStatus.OFFERED}->${AdmissionStatus.DECLINED}`]: 'Admission declined',
    [`${AdmissionStatus.OFFERED}->${AdmissionStatus.DEFERRED}`]: 'Admission deferred',
    [`${AdmissionStatus.DEFERRED}->${AdmissionStatus.ACCEPTED}`]: 'Deferred admission accepted',
    [`${AdmissionStatus.DEFERRED}->${AdmissionStatus.DECLINED}`]: 'Deferred admission declined',
    [`${AdmissionStatus.DEFERRED}->${AdmissionStatus.EXPIRED}`]: 'Deferred admission expired',
  };

  const key = `${currentStatus}->${targetStatus}`;
  return reasonMap[key] || `Status changed from ${currentStatus} to ${targetStatus}`;
}
