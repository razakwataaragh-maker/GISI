/**
 * Programme module contracts and types
 */

export type ProgrammeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Programme {
    id: string;
    programmeCode: string;
    name: string;
    description: string | null;
    status: ProgrammeStatus;
    currentVersion: number;
    effectiveFrom: Date | null;
    effectiveTo: Date | null;
    publishedAt: Date | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    statusChangedAt: Date;
    statusChangedBy: string;
    statusChangeReason: string;
}

export interface CreateProgrammeInput {
    programmeCode: string;
    name: string;
    description?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    createdBy: string;
}

export interface UpdateProgrammeInput {
    name?: string;
    description?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    updatedBy: string;
    changeReason: string;
}

export interface PublishProgrammeInput {
    publishedBy: string;
    publishReason: string;
}

export interface ArchiveProgrammeInput {
    archivedBy: string;
    archiveReason: string;
}

export interface ProgrammeVersion {
    id: string;
    programmeId: string;
    versionNumber: number;
    programmeCode: string;
    name: string;
    description: string | null;
    effectiveFrom: Date | null;
    effectiveTo: Date | null;
    publishedAt: Date | null;
    createdAt: Date;
    createdBy: string;
}

export interface ProgrammeHistory {
    id: string;
    programmeId: string;
    changedField: string;
    previousValue: string | null;
    newValue: string | null;
    changedAt: Date;
    changedBy: string;
    changeReason: string;
    changeReference: string | null;
    createdAt: Date;
}

export interface ProgrammeSearchParams {
    programmeCode?: string;
    name?: string;
    status?: ProgrammeStatus;
    limit?: number;
    offset?: number;
}
