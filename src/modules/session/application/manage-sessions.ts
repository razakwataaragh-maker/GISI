import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import type { SessionRepository } from '../infrastructure/session-repository.js';
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
    InvalidSessionStatusTransitionError,
    SessionAlreadyArchivedError,
    SessionAlreadyClosedError,
    SessionAlreadyOpenError,
    SessionCannotCloseError,
    SessionCannotOpenError,
    SessionNotFoundError,
} from '../domain/session.js';
import { validateStatusTransition } from '../domain/session-status-transitions.js';

export class ManageSessions {
    constructor(
        private readonly sessionRepository: SessionRepository,
        private readonly auditWriter: AuditWriter,
    ) {}

    async createSession(input: CreateSessionInput): Promise<Session> {
        try {
            const session = await this.sessionRepository.createSession(input);

            await this.auditWriter.append({
                eventName: 'session.created',
                category: 'session',
                actorId: input.createdBy,
                actorType: 'user',
                targetType: 'session',
                targetId: session.id,
                action: 'create',
                outcome: 'success',
                owningModule: 'session',
                sourceBoundary: 'application',
                reason: 'Session creation',
                beforeState: null,
                afterState: {
                    name: session.name,
                    startDate: session.startDate.toISOString(),
                    endDate: session.endDate.toISOString(),
                    status: session.status,
                },
            });

            return session;
        } catch (error) {
            if (error instanceof Error) {
                await this.auditWriter.append({
                    eventName: 'session.creation_failed',
                    category: 'session',
                    actorId: input.createdBy,
                    actorType: 'user',
                    targetType: 'session',
                    action: 'create',
                    outcome: 'failure',
                    owningModule: 'session',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async getSessionById(id: string): Promise<Session> {
        return this.sessionRepository.getSessionById(id);
    }

    async searchSessions(params: SessionSearchParams): Promise<Session[]> {
        return this.sessionRepository.searchSessions(params);
    }

    async updateSession(id: string, input: UpdateSessionInput): Promise<Session> {
        try {
            const existing = await this.sessionRepository.getSessionById(id);

            // Check if session can be modified
            if (existing.status !== 'DRAFT') {
                throw new SessionAlreadyArchivedError(id);
            }

            const session = await this.sessionRepository.updateSession(id, input);

            await this.auditWriter.append({
                eventName: 'session.updated',
                category: 'session',
                actorId: input.updatedBy,
                actorType: 'user',
                targetType: 'session',
                targetId: id,
                action: 'update',
                outcome: 'success',
                owningModule: 'session',
                sourceBoundary: 'application',
                reason: input.changeReason,
                beforeState: {
                    name: existing.name,
                    startDate: existing.startDate.toISOString(),
                },
                afterState: {
                    name: session.name,
                    startDate: session.startDate.toISOString(),
                },
            });

            return session;
        } catch (error) {
            if (error instanceof Error) {
                await this.auditWriter.append({
                    eventName: 'session.update_failed',
                    category: 'session',
                    actorId: input.updatedBy,
                    actorType: 'user',
                    targetType: 'session',
                    targetId: id,
                    action: 'update',
                    outcome: 'failure',
                    owningModule: 'session',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async openSession(id: string, input: OpenSessionInput): Promise<Session> {
        try {
            const existing = await this.sessionRepository.getSessionById(id);

            // Validate status transition
            validateStatusTransition(existing.status, 'OPEN');

            const session = await this.sessionRepository.openSession(id, input);

            await this.auditWriter.append({
                eventName: 'session.opened',
                category: 'session',
                actorId: input.openedBy,
                actorType: 'user',
                targetType: 'session',
                targetId: id,
                action: 'open',
                outcome: 'success',
                owningModule: 'session',
                sourceBoundary: 'application',
                reason: input.openReason,
                beforeState: { status: existing.status },
                afterState: { status: session.status },
            });

            return session;
        } catch (error) {
            if (error instanceof InvalidSessionStatusTransitionError) {
                await this.auditWriter.append({
                    eventName: 'session.open_invalid',
                    category: 'session',
                    actorId: input.openedBy,
                    actorType: 'user',
                    targetType: 'session',
                    targetId: id,
                    action: 'open',
                    outcome: 'failure',
                    owningModule: 'session',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async closeSession(id: string, input: CloseSessionInput): Promise<Session> {
        try {
            const existing = await this.sessionRepository.getSessionById(id);

            // Validate status transition
            validateStatusTransition(existing.status, 'CLOSED');

            const session = await this.sessionRepository.closeSession(id, input);

            await this.auditWriter.append({
                eventName: 'session.closed',
                category: 'session',
                actorId: input.closedBy,
                actorType: 'user',
                targetType: 'session',
                targetId: id,
                action: 'close',
                outcome: 'success',
                owningModule: 'session',
                sourceBoundary: 'application',
                reason: input.closeReason,
                beforeState: { status: existing.status },
                afterState: { status: session.status },
            });

            return session;
        } catch (error) {
            if (error instanceof InvalidSessionStatusTransitionError) {
                await this.auditWriter.append({
                    eventName: 'session.close_invalid',
                    category: 'session',
                    actorId: input.closedBy,
                    actorType: 'user',
                    targetType: 'session',
                    targetId: id,
                    action: 'close',
                    outcome: 'failure',
                    owningModule: 'session',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async archiveSession(id: string, input: ArchiveSessionInput): Promise<Session> {
        try {
            const existing = await this.sessionRepository.getSessionById(id);

            // Validate status transition
            validateStatusTransition(existing.status, 'ARCHIVED');

            const session = await this.sessionRepository.archiveSession(id, input);

            await this.auditWriter.append({
                eventName: 'session.archived',
                category: 'session',
                actorId: input.archivedBy,
                actorType: 'user',
                targetType: 'session',
                targetId: id,
                action: 'archive',
                outcome: 'success',
                owningModule: 'session',
                sourceBoundary: 'application',
                reason: input.archiveReason,
                beforeState: { status: existing.status },
                afterState: { status: session.status },
            });

            return session;
        } catch (error) {
            if (error instanceof InvalidSessionStatusTransitionError) {
                await this.auditWriter.append({
                    eventName: 'session.archive_invalid',
                    category: 'session',
                    actorId: input.archivedBy,
                    actorType: 'user',
                    targetType: 'session',
                    targetId: id,
                    action: 'archive',
                    outcome: 'failure',
                    owningModule: 'session',
                    sourceBoundary: 'application',
                    reason: error.message,
                });
            }
            throw error;
        }
    }

    async getSessionHistory(sessionId: string): Promise<SessionHistory[]> {
        return this.sessionRepository.getSessionHistory(sessionId);
    }
}
