import type { PrismaClient } from '@prisma/client';
import type {
    ArchiveSessionInput,
    CloseSessionInput,
    CreateSessionInput,
    OpenSessionInput,
    Session,
    SessionHistory,
    SessionSearchParams,
    UpdateSessionInput,
} from '../contracts/session.js';
import {
    InvalidSessionDatesError,
    InvalidSessionWindowError,
    SessionAlreadyArchivedError,
    SessionAlreadyClosedError,
    SessionAlreadyOpenError,
    SessionCannotCloseError,
    SessionCannotOpenError,
    SessionNotFoundError,
} from '../domain/session.js';

export class SessionRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async createSession(input: CreateSessionInput): Promise<Session> {
        // Validate session dates
        this.validateSessionDates(input.startDate, input.endDate);

        // Validate windows if provided
        if (input.applicationWindowStart || input.applicationWindowEnd) {
            this.validateApplicationWindow(
                input.startDate,
                input.endDate,
                input.applicationWindowStart,
                input.applicationWindowEnd,
            );
        }

        if (input.registrationWindowStart || input.registrationWindowEnd) {
            this.validateRegistrationWindow(
                input.startDate,
                input.endDate,
                input.applicationWindowStart,
                input.applicationWindowEnd,
                input.registrationWindowStart,
                input.registrationWindowEnd,
            );
        }

        const session = await this.prisma.session.create({
            data: {
                name: input.name,
                startDate: input.startDate,
                endDate: input.endDate,
                applicationWindowStart: input.applicationWindowStart ?? null,
                applicationWindowEnd: input.applicationWindowEnd ?? null,
                registrationWindowStart: input.registrationWindowStart ?? null,
                registrationWindowEnd: input.registrationWindowEnd ?? null,
                status: 'DRAFT',
                createdBy: input.createdBy,
                updatedBy: input.createdBy,
                statusChangedBy: input.createdBy,
                statusChangeReason: 'Initial session creation',
            },
        });

        return this.mapToSession(session);
    }

    async getSessionById(id: string): Promise<Session> {
        const session = await this.prisma.session.findUnique({
            where: { id },
        });

        if (!session) {
            throw new SessionNotFoundError(id);
        }

        return this.mapToSession(session);
    }

    async searchSessions(params: SessionSearchParams): Promise<Session[]> {
        const where: any = {};

        if (params.name) {
            where.name = { contains: params.name, mode: 'insensitive' };
        }
        if (params.status) {
            where.status = params.status;
        }
        if (params.startDateFrom || params.startDateTo) {
            where.startDate = {};
            if (params.startDateFrom) {
                where.startDate.gte = params.startDateFrom;
            }
            if (params.startDateTo) {
                where.startDate.lte = params.startDateTo;
            }
        }

        const sessions = await this.prisma.session.findMany({
            where,
            take: params.limit || 50,
            skip: params.offset || 0,
            orderBy: { startDate: 'desc' },
        });

        return sessions.map((s) => this.mapToSession(s));
    }

    async updateSession(id: string, input: UpdateSessionInput): Promise<Session> {
        const existing = await this.getSessionById(id);

        // Check if session can be modified
        if (existing.status !== 'DRAFT') {
            throw new SessionAlreadyArchivedError(id);
        }

        // Validate dates if provided
        const startDate = input.startDate ?? existing.startDate;
        const endDate = input.endDate ?? existing.endDate;
        this.validateSessionDates(startDate, endDate);

        // Validate windows if provided
        const appStart = input.applicationWindowStart ?? existing.applicationWindowStart;
        const appEnd = input.applicationWindowEnd ?? existing.applicationWindowEnd;
        const regStart = input.registrationWindowStart ?? existing.registrationWindowStart;
        const regEnd = input.registrationWindowEnd ?? existing.registrationWindowEnd;

        if (input.applicationWindowStart !== undefined || input.applicationWindowEnd !== undefined) {
            this.validateApplicationWindow(startDate, endDate, appStart, appEnd);
        }

        if (input.registrationWindowStart !== undefined || input.registrationWindowEnd !== undefined) {
            this.validateRegistrationWindow(startDate, endDate, appStart, appEnd, regStart, regEnd);
        }

        // Track changes for history
        const changes: Array<{ field: string; previous: string; new: string }> = [];
        if (input.name && input.name !== existing.name) {
            changes.push({ field: 'name', previous: existing.name, new: input.name });
        }
        if (input.startDate && input.startDate.getTime() !== existing.startDate.getTime()) {
            changes.push({ field: 'startDate', previous: existing.startDate.toISOString(), new: input.startDate.toISOString() });
        }

        const session = await this.prisma.session.update({
            where: { id },
            data: {
                ...(input.name !== undefined && { name: input.name }),
                ...(input.startDate !== undefined && { startDate: input.startDate }),
                ...(input.endDate !== undefined && { endDate: input.endDate }),
                ...(input.applicationWindowStart !== undefined && { applicationWindowStart: input.applicationWindowStart }),
                ...(input.applicationWindowEnd !== undefined && { applicationWindowEnd: input.applicationWindowEnd }),
                ...(input.registrationWindowStart !== undefined && { registrationWindowStart: input.registrationWindowStart }),
                ...(input.registrationWindowEnd !== undefined && { registrationWindowEnd: input.registrationWindowEnd }),
                updatedBy: input.updatedBy,
            },
        });

        // Create history records
        for (const change of changes) {
            await this.prisma.sessionHistory.create({
                data: {
                    sessionId: id,
                    changedField: change.field,
                    previousValue: change.previous,
                    newValue: change.new,
                    changedAt: new Date(),
                    changedBy: input.updatedBy,
                    changeReason: input.changeReason,
                },
            });
        }

        return this.mapToSession(session);
    }

    async openSession(id: string, input: OpenSessionInput): Promise<Session> {
        const existing = await this.getSessionById(id);

        // Validate session can be opened
        if (existing.status === 'OPEN') {
            throw new SessionAlreadyOpenError(id);
        }
        if (existing.status === 'CLOSED') {
            throw new SessionCannotOpenError(id, 'Session is already closed');
        }
        if (existing.status === 'ARCHIVED') {
            throw new SessionAlreadyArchivedError(id);
        }

        // Validate windows are present
        if (!existing.applicationWindowStart || !existing.applicationWindowEnd) {
            throw new SessionCannotOpenError(id, 'Application window is required');
        }
        if (!existing.registrationWindowStart || !existing.registrationWindowEnd) {
            throw new SessionCannotOpenError(id, 'Registration window is required');
        }

        const session = await this.prisma.session.update({
            where: { id },
            data: {
                status: 'OPEN',
                openedAt: new Date(),
                statusChangedAt: new Date(),
                statusChangedBy: input.openedBy,
                statusChangeReason: input.openReason,
                updatedBy: input.openedBy,
            },
        });

        return this.mapToSession(session);
    }

    async closeSession(id: string, input: CloseSessionInput): Promise<Session> {
        const existing = await this.getSessionById(id);

        // Validate session can be closed
        if (existing.status === 'CLOSED') {
            throw new SessionAlreadyClosedError(id);
        }
        if (existing.status === 'ARCHIVED') {
            throw new SessionAlreadyArchivedError(id);
        }
        if (existing.status === 'DRAFT') {
            throw new SessionCannotCloseError(id, 'Session is not open');
        }

        const session = await this.prisma.session.update({
            where: { id },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                statusChangedAt: new Date(),
                statusChangedBy: input.closedBy,
                statusChangeReason: input.closeReason,
                updatedBy: input.closedBy,
            },
        });

        return this.mapToSession(session);
    }

    async archiveSession(id: string, input: ArchiveSessionInput): Promise<Session> {
        const existing = await this.getSessionById(id);

        const session = await this.prisma.session.update({
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

        return this.mapToSession(session);
    }

    async getSessionHistory(sessionId: string): Promise<SessionHistory[]> {
        const history = await this.prisma.sessionHistory.findMany({
            where: { sessionId },
            orderBy: { changedAt: 'desc' },
        });

        return history.map((h) => ({
            id: h.id,
            sessionId: h.sessionId,
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

    private validateSessionDates(startDate: Date, endDate: Date): void {
        if (startDate >= endDate) {
            throw new InvalidSessionDatesError('Start date must be before end date');
        }
    }

    private validateApplicationWindow(
        sessionStart: Date,
        sessionEnd: Date,
        appStart?: Date | null,
        appEnd?: Date | null,
    ): void {
        if (appStart && appEnd) {
            if (appStart >= appEnd) {
                throw new InvalidSessionWindowError('Application window start must be before end');
            }
            if (appStart < sessionStart) {
                throw new InvalidSessionWindowError('Application window start must be within session dates');
            }
            if (appEnd > sessionEnd) {
                throw new InvalidSessionWindowError('Application window end must be within session dates');
            }
        }
    }

    private validateRegistrationWindow(
        sessionStart: Date,
        sessionEnd: Date,
        appStart?: Date | null,
        appEnd?: Date | null,
        regStart?: Date | null,
        regEnd?: Date | null,
    ): void {
        if (regStart && regEnd) {
            if (regStart >= regEnd) {
                throw new InvalidSessionWindowError('Registration window start must be before end');
            }
            if (regStart < sessionStart) {
                throw new InvalidSessionWindowError('Registration window start must be within session dates');
            }
            if (regEnd > sessionEnd) {
                throw new InvalidSessionWindowError('Registration window end must be within session dates');
            }
            if (appEnd && regStart < appEnd) {
                throw new InvalidSessionWindowError('Registration window must start after application window ends');
            }
        }
    }

    private mapToSession(prismaSession: any): Session {
        return {
            id: prismaSession.id,
            name: prismaSession.name,
            startDate: prismaSession.startDate,
            endDate: prismaSession.endDate,
            applicationWindowStart: prismaSession.applicationWindowStart,
            applicationWindowEnd: prismaSession.applicationWindowEnd,
            registrationWindowStart: prismaSession.registrationWindowStart,
            registrationWindowEnd: prismaSession.registrationWindowEnd,
            status: prismaSession.status as any,
            openedAt: prismaSession.openedAt,
            closedAt: prismaSession.closedAt,
            archivedAt: prismaSession.archivedAt,
            createdAt: prismaSession.createdAt,
            updatedAt: prismaSession.updatedAt,
            createdBy: prismaSession.createdBy,
            updatedBy: prismaSession.updatedBy,
            statusChangedAt: prismaSession.statusChangedAt,
            statusChangedBy: prismaSession.statusChangedBy,
            statusChangeReason: prismaSession.statusChangeReason,
        };
    }
}
