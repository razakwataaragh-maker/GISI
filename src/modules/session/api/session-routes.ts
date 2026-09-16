import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import type { ManageSessions } from '../application/index.js';
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

export function registerSessionRoutes(
    fastify: FastifyInstance,
    dependencies: {
        manageSessions: ManageSessions;
        auditWriter: AuditWriter;
    },
) {
    const { manageSessions } = dependencies;

    // POST /api/v1/sessions - Create session
    fastify.post(
        '/api/v1/sessions',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'startDate', 'endDate', 'createdBy'],
                    properties: {
                        name: { type: 'string' },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
                        applicationWindowStart: { type: 'string', format: 'date-time', nullable: true },
                        applicationWindowEnd: { type: 'string', format: 'date-time', nullable: true },
                        registrationWindowStart: { type: 'string', format: 'date-time', nullable: true },
                        registrationWindowEnd: { type: 'string', format: 'date-time', nullable: true },
                        createdBy: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: CreateSessionInput }>) => {
            const session = await manageSessions.createSession(request.body);
            return { data: session };
        },
    );

    // GET /api/v1/sessions - Search sessions
    fastify.get(
        '/api/v1/sessions',
        {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        status: { type: 'string', enum: ['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'] },
                        startDateFrom: { type: 'string', format: 'date-time' },
                        startDateTo: { type: 'string', format: 'date-time' },
                        limit: { type: 'number', minimum: 1, maximum: 100 },
                        offset: { type: 'number', minimum: 0 },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Querystring: SessionSearchParams }>) => {
            const sessions = await manageSessions.searchSessions(request.query);
            return { data: sessions, count: sessions.length };
        },
    );

    // GET /api/v1/sessions/:id - Get session by ID
    fastify.get(
        '/api/v1/sessions/:id',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string } }>) => {
            const session = await manageSessions.getSessionById(request.params.id);
            return { data: session };
        },
    );

    // PATCH /api/v1/sessions/:id - Update session
    fastify.patch(
        '/api/v1/sessions/:id',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' },
                    },
                },
                body: {
                    type: 'object',
                    required: ['updatedBy', 'changeReason'],
                    properties: {
                        name: { type: 'string', nullable: true },
                        startDate: { type: 'string', format: 'date-time', nullable: true },
                        endDate: { type: 'string', format: 'date-time', nullable: true },
                        applicationWindowStart: { type: 'string', format: 'date-time', nullable: true },
                        applicationWindowEnd: { type: 'string', format: 'date-time', nullable: true },
                        registrationWindowStart: { type: 'string', format: 'date-time', nullable: true },
                        registrationWindowEnd: { type: 'string', format: 'date-time', nullable: true },
                        updatedBy: { type: 'string' },
                        changeReason: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateSessionInput }>) => {
            const session = await manageSessions.updateSession(request.params.id, request.body);
            return { data: session };
        },
    );

    // POST /api/v1/sessions/:id/open - Open session
    fastify.post(
        '/api/v1/sessions/:id/open',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' },
                    },
                },
                body: {
                    type: 'object',
                    required: ['openedBy', 'openReason'],
                    properties: {
                        openedBy: { type: 'string' },
                        openReason: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: OpenSessionInput }>) => {
            const session = await manageSessions.openSession(request.params.id, request.body);
            return { data: session };
        },
    );

    // POST /api/v1/sessions/:id/close - Close session
    fastify.post(
        '/api/v1/sessions/:id/close',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['id'],
                    properties: {
                        id: { type: 'string' },
                    },
                },
                body: {
                    type: 'object',
                    required: ['closedBy', 'closeReason'],
                    properties: {
                        closedBy: { type: 'string' },
                        closeReason: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: CloseSessionInput }>) => {
            const session = await manageSessions.closeSession(request.params.id, request.body);
            return { data: session };
        },
    );
}
