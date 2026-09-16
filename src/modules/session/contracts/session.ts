/**
 * Session module contracts and types
 */

export type SessionStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'ARCHIVED';

export interface Session {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    applicationWindowStart: Date | null;
    applicationWindowEnd: Date | null;
    registrationWindowStart: Date | null;
    registrationWindowEnd: Date | null;
    status: SessionStatus;
    openedAt: Date | null;
    closedAt: Date | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    statusChangedAt: Date;
    statusChangedBy: string;
    statusChangeReason: string;
}

export interface CreateSessionInput {
    name: string;
    startDate: Date;
    endDate: Date;
    applicationWindowStart?: Date;
    applicationWindowEnd?: Date;
    registrationWindowStart?: Date;
    registrationWindowEnd?: Date;
    createdBy: string;
}

export interface UpdateSessionInput {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    applicationWindowStart?: Date;
    applicationWindowEnd?: Date;
    registrationWindowStart?: Date;
    registrationWindowEnd?: Date;
    updatedBy: string;
    changeReason: string;
}

export interface OpenSessionInput {
    openedBy: string;
    openReason: string;
}

export interface CloseSessionInput {
    closedBy: string;
    closeReason: string;
}

export interface ArchiveSessionInput {
    archivedBy: string;
    archiveReason: string;
}

export interface SessionHistory {
    id: string;
    sessionId: string;
    changedField: string;
    previousValue: string | null;
    newValue: string | null;
    changedAt: Date;
    changedBy: string;
    changeReason: string;
    changeReference: string | null;
    createdAt: Date;
}

export interface SessionSearchParams {
    name?: string;
    status?: SessionStatus;
    startDateFrom?: Date;
    startDateTo?: Date;
    limit?: number;
    offset?: number;
}
