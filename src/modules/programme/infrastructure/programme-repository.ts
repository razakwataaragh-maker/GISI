import type { PrismaClient } from '@prisma/client';
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
    ProgrammeAlreadyArchivedError,
    ProgrammeAlreadyPublishedError,
    ProgrammeCodeAlreadyExistsError,
    ProgrammeNotFoundError,
} from '../domain/programme.js';

export class ProgrammeRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async createProgramme(input: CreateProgrammeInput): Promise<Programme> {
        try {
            const programme = await this.prisma.programme.create({
                data: {
                    programmeCode: input.programmeCode,
                    name: input.name,
                    description: input.description ?? null,
                    effectiveFrom: input.effectiveFrom ?? null,
                    effectiveTo: input.effectiveTo ?? null,
                    status: 'DRAFT',
                    currentVersion: 1,
                    createdBy: input.createdBy,
                    updatedBy: input.createdBy,
                    statusChangedBy: input.createdBy,
                    statusChangeReason: 'Initial programme creation',
                },
            });

            // Create initial version
            await this.prisma.programmeVersion.create({
                data: {
                    programmeId: programme.id,
                    versionNumber: 1,
                    programmeCode: programme.programmeCode,
                    name: programme.name,
                    description: programme.description,
                    effectiveFrom: programme.effectiveFrom,
                    effectiveTo: programme.effectiveTo,
                    publishedAt: null,
                    createdBy: input.createdBy,
                },
            });

            return this.mapToProgramme(programme);
        } catch (error) {
            // Handle unique constraint violation on programme_code
            if (error instanceof Error && error.message.includes('unique constraint')) {
                throw new ProgrammeCodeAlreadyExistsError(input.programmeCode);
            }
            throw error;
        }
    }

    async getProgrammeById(id: string): Promise<Programme> {
        const programme = await this.prisma.programme.findUnique({
            where: { id },
        });

        if (!programme) {
            throw new ProgrammeNotFoundError(id);
        }

        return this.mapToProgramme(programme);
    }

    async getProgrammeByCode(programmeCode: string): Promise<Programme> {
        const programme = await this.prisma.programme.findUnique({
            where: { programmeCode },
        });

        if (!programme) {
            throw new ProgrammeNotFoundError(programmeCode);
        }

        return this.mapToProgramme(programme);
    }

    async searchProgrammes(params: ProgrammeSearchParams): Promise<Programme[]> {
        const where: any = {};

        if (params.programmeCode) {
            where.programmeCode = { contains: params.programmeCode, mode: 'insensitive' };
        }
        if (params.name) {
            where.name = { contains: params.name, mode: 'insensitive' };
        }
        if (params.status) {
            where.status = params.status;
        }

        const programmes = await this.prisma.programme.findMany({
            where,
            take: params.limit || 50,
            skip: params.offset || 0,
            orderBy: { createdAt: 'desc' },
        });

        return programmes.map((p) => this.mapToProgramme(p));
    }

    async updateProgramme(id: string, input: UpdateProgrammeInput): Promise<Programme> {
        const existing = await this.getProgrammeById(id);

        // Check if programme can be modified
        if (existing.status === 'PUBLISHED') {
            throw new ProgrammeAlreadyPublishedError(id);
        }
        if (existing.status === 'ARCHIVED') {
            throw new ProgrammeAlreadyArchivedError(id);
        }

        // Track changes for history
        const changes: Array<{ field: string; previous: string; new: string }> = [];
        if (input.name && input.name !== existing.name) {
            changes.push({ field: 'name', previous: existing.name, new: input.name });
        }
        if (input.description !== undefined && input.description !== existing.description) {
            changes.push({ field: 'description', previous: existing.description || '', new: input.description || '' });
        }

        const programme = await this.prisma.programme.update({
            where: { id },
            data: {
                ...(input.name !== undefined && { name: input.name }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.effectiveFrom !== undefined && { effectiveFrom: input.effectiveFrom }),
                ...(input.effectiveTo !== undefined && { effectiveTo: input.effectiveTo }),
                updatedBy: input.updatedBy,
            },
        });

        // Create history records
        for (const change of changes) {
            await this.prisma.programmeHistory.create({
                data: {
                    programmeId: id,
                    changedField: change.field,
                    previousValue: change.previous,
                    newValue: change.new,
                    changedAt: new Date(),
                    changedBy: input.updatedBy,
                    changeReason: input.changeReason,
                },
            });
        }

        return this.mapToProgramme(programme);
    }

    async publishProgramme(id: string, input: PublishProgrammeInput): Promise<Programme> {
        const existing = await this.getProgrammeById(id);

        const programme = await this.prisma.programme.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
                statusChangedAt: new Date(),
                statusChangedBy: input.publishedBy,
                statusChangeReason: input.publishReason,
                updatedBy: input.publishedBy,
            },
        });

        // Update the current version with publication timestamp
        await this.prisma.programmeVersion.updateMany({
            where: {
                programmeId: id,
                versionNumber: existing.currentVersion,
            },
            data: {
                publishedAt: new Date(),
            },
        });

        return this.mapToProgramme(programme);
    }

    async archiveProgramme(id: string, input: ArchiveProgrammeInput): Promise<Programme> {
        const existing = await this.getProgrammeById(id);

        const programme = await this.prisma.programme.update({
            where: { id },
            data: {
                status: 'ARCHIVED',
                archivedAt: new Date(),
                statusChangedAt: new Date(),
                statusChangedBy: input.archivedBy,
                statusChangeReason: input.archiveReason,
                updatedBy: input.archivedBy,
            },
        });

        return this.mapToProgramme(programme);
    }

    async getProgrammeVersions(programmeId: string): Promise<ProgrammeVersion[]> {
        const versions = await this.prisma.programmeVersion.findMany({
            where: { programmeId },
            orderBy: { versionNumber: 'desc' },
        });

        return versions.map((v) => ({
            id: v.id,
            programmeId: v.programmeId,
            versionNumber: v.versionNumber,
            programmeCode: v.programmeCode,
            name: v.name,
            description: v.description,
            effectiveFrom: v.effectiveFrom,
            effectiveTo: v.effectiveTo,
            publishedAt: v.publishedAt,
            createdAt: v.createdAt,
            createdBy: v.createdBy,
        }));
    }

    async getProgrammeHistory(programmeId: string): Promise<ProgrammeHistory[]> {
        const history = await this.prisma.programmeHistory.findMany({
            where: { programmeId },
            orderBy: { changedAt: 'desc' },
        });

        return history.map((h) => ({
            id: h.id,
            programmeId: h.programmeId,
            changedField: h.changedField,
            previousValue: h.previousValue,
            newValue: h.newValue,
            changedAt: h.changedAt,
            changedBy: h.changedBy,
            changeReason: h.changeReason,
            changeReference: h.changeReference || null,
            createdAt: h.createdAt,
        }));
    }

    private mapToProgramme(prismaProgramme: any): Programme {
        return {
            id: prismaProgramme.id,
            programmeCode: prismaProgramme.programmeCode,
            name: prismaProgramme.name,
            description: prismaProgramme.description,
            status: prismaProgramme.status as any,
            currentVersion: prismaProgramme.currentVersion,
            effectiveFrom: prismaProgramme.effectiveFrom,
            effectiveTo: prismaProgramme.effectiveTo,
            publishedAt: prismaProgramme.publishedAt,
            archivedAt: prismaProgramme.archivedAt,
            createdAt: prismaProgramme.createdAt,
            updatedAt: prismaProgramme.updatedAt,
            createdBy: prismaProgramme.createdBy,
            updatedBy: prismaProgramme.updatedBy,
            statusChangedAt: prismaProgramme.statusChangedAt,
            statusChangedBy: prismaProgramme.statusChangedBy,
            statusChangeReason: prismaProgramme.statusChangeReason,
        };
    }
}
