import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import type { ProgrammeRepository } from '../infrastructure/programme-repository.js';
import type {
    ArchiveProgrammeInput,
    CreateProgrammeInput,
    Programme,
    ProgrammeHistory,
    ProgrammeSearchParams,
    ProgrammeVersion,
    PublishProgrammeInput,
    UpdateProgrammeInput,
} from '../contracts/programme.js';
import {
    InvalidProgrammeStatusTransitionError,
    ProgrammeAlreadyArchivedError,
    ProgrammeAlreadyPublishedError,
    ProgrammeCannotPublishDraftError,
    ProgrammeNotFoundError,
} from '../domain/programme.js';
import { validateStatusTransition } from '../domain/programme-status-transitions.js';

export class ManageProgrammes {
    constructor(
        private readonly programmeRepository: ProgrammeRepository,
        private readonly auditWriter: AuditWriter,
    ) {}

    async createProgramme(input: CreateProgrammeInput): Promise<Programme> {
        try {
            const programme = await this.programmeRepository.createProgramme(input);

            await this.auditWriter.append({
                eventName: 'programme.created',
                category: 'programme',
                actorId: input.createdBy,
                actorType: 'user',
                targetType: 'programme',
                targetId: programme.id,
                action: 'create',
                outcome: 'success',
                owningModule: 'programme',
                sourceBoundary: 'application',
                reason: 'Programme creation',
                beforeState: null,
                afterState: {
                    programmeCode: programme.programmeCode,
                    name: programme.name,
                    status: programme.status,
                },
            });

            return programme;
        } catch (error) {
            if (error instanceof Error) {
                await this.auditWriter.append({
                    eventName: 'programme.creation_failed',
                    category: 'programme',
                    actorId: input.createdBy,
                    actorType: 'user',
                    targetType: 'programme',
                    action: 'create',
                    outcome: 'failure',
                    owningModule: 'programme',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async getProgrammeById(id: string): Promise<Programme> {
        return this.programmeRepository.getProgrammeById(id);
    }

    async getProgrammeByCode(programmeCode: string): Promise<Programme> {
        return this.programmeRepository.getProgrammeByCode(programmeCode);
    }

    async searchProgrammes(params: ProgrammeSearchParams): Promise<Programme[]> {
        return this.programmeRepository.searchProgrammes(params);
    }

    async updateProgramme(id: string, input: UpdateProgrammeInput): Promise<Programme> {
        try {
            const existing = await this.programmeRepository.getProgrammeById(id);

            // Check if programme can be modified
            if (existing.status === 'PUBLISHED') {
                throw new ProgrammeAlreadyPublishedError(id);
            }
            if (existing.status === 'ARCHIVED') {
                throw new ProgrammeAlreadyArchivedError(id);
            }

            const programme = await this.programmeRepository.updateProgramme(id, input);

            await this.auditWriter.append({
                eventName: 'programme.updated',
                category: 'programme',
                actorId: input.updatedBy,
                actorType: 'user',
                targetType: 'programme',
                targetId: id,
                action: 'update',
                outcome: 'success',
                owningModule: 'programme',
                sourceBoundary: 'application',
                reason: input.changeReason,
                beforeState: {
                    name: existing.name,
                    description: existing.description,
                },
                afterState: {
                    name: programme.name,
                    description: programme.description,
                },
            });

            return programme;
        } catch (error) {
            if (error instanceof Error) {
                await this.auditWriter.append({
                    eventName: 'programme.update_failed',
                    category: 'programme',
                    actorId: input.updatedBy,
                    actorType: 'user',
                    targetType: 'programme',
                    targetId: id,
                    action: 'update',
                    outcome: 'failure',
                    owningModule: 'programme',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async publishProgramme(id: string, input: PublishProgrammeInput): Promise<Programme> {
        try {
            const existing = await this.programmeRepository.getProgrammeById(id);

            // Validate status transition
            validateStatusTransition(existing.status, 'PUBLISHED');

            // Validate that programme can be published (required fields)
            if (!existing.name || !existing.programmeCode) {
                throw new ProgrammeCannotPublishDraftError(id);
            }

            const programme = await this.programmeRepository.publishProgramme(id, input);

            await this.auditWriter.append({
                eventName: 'programme.published',
                category: 'programme',
                actorId: input.publishedBy,
                actorType: 'user',
                targetType: 'programme',
                targetId: id,
                action: 'publish',
                outcome: 'success',
                owningModule: 'programme',
                sourceBoundary: 'application',
                reason: input.publishReason,
                beforeState: { status: existing.status },
                afterState: { status: programme.status },
            });

            return programme;
        } catch (error) {
            if (error instanceof InvalidProgrammeStatusTransitionError) {
                await this.auditWriter.append({
                    eventName: 'programme.publish_invalid',
                    category: 'programme',
                    actorId: input.publishedBy,
                    actorType: 'user',
                    targetType: 'programme',
                    targetId: id,
                    action: 'publish',
                    outcome: 'failure',
                    owningModule: 'programme',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async archiveProgramme(id: string, input: ArchiveProgrammeInput): Promise<Programme> {
        try {
            const existing = await this.programmeRepository.getProgrammeById(id);

            // Validate status transition
            validateStatusTransition(existing.status, 'ARCHIVED');

            const programme = await this.programmeRepository.archiveProgramme(id, input);

            await this.auditWriter.append({
                eventName: 'programme.archived',
                category: 'programme',
                actorId: input.archivedBy,
                actorType: 'user',
                targetType: 'programme',
                targetId: id,
                action: 'archive',
                outcome: 'success',
                owningModule: 'programme',
                sourceBoundary: 'application',
                reason: input.archiveReason,
                beforeState: { status: existing.status },
                afterState: { status: programme.status },
            });

            return programme;
        } catch (error) {
            if (error instanceof InvalidProgrammeStatusTransitionError) {
                await this.auditWriter.append({
                    eventName: 'programme.archive_invalid',
                    category: 'programme',
                    actorId: input.archivedBy,
                    actorType: 'user',
                    targetType: 'programme',
                    targetId: id,
                    action: 'archive',
                    outcome: 'failure',
                    owningModule: 'programme',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async getProgrammeVersions(programmeId: string): Promise<ProgrammeVersion[]> {
        return this.programmeRepository.getProgrammeVersions(programmeId);
    }

    async getProgrammeHistory(programmeId: string): Promise<ProgrammeHistory[]> {
        return this.programmeRepository.getProgrammeHistory(programmeId);
    }
}
