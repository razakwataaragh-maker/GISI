import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AuditWriter } from '../../audit/domain/audit-writer.js';
import type { ManageProgrammes } from '../application/index.js';
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

export function registerProgrammeRoutes(
    fastify: FastifyInstance,
    dependencies: {
        manageProgrammes: ManageProgrammes;
        auditWriter: AuditWriter;
    },
) {
    const { manageProgrammes } = dependencies;

    // POST /api/v1/programmes - Create programme
    fastify.post(
        '/api/v1/programmes',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['programmeCode', 'name', 'createdBy'],
                    properties: {
                        programmeCode: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        effectiveFrom: { type: 'string', format: 'date-time', nullable: true },
                        effectiveTo: { type: 'string', format: 'date-time', nullable: true },
                        createdBy: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: CreateProgrammeInput }>) => {
            const programme = await manageProgrammes.createProgramme(request.body);
            return { data: programme };
        },
    );

    // GET /api/v1/programmes - Search programmes
    fastify.get(
        '/api/v1/programmes',
        {
            schema: {
                querystring: {
                    type: 'object',
                    properties: {
                        programmeCode: { type: 'string' },
                        name: { type: 'string' },
                        status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
                        limit: { type: 'number', minimum: 1, maximum: 100 },
                        offset: { type: 'number', minimum: 0 },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Querystring: ProgrammeSearchParams }>) => {
            const programmes = await manageProgrammes.searchProgrammes(request.query);
            return { data: programmes, count: programmes.length };
        },
    );

    // GET /api/v1/programmes/:id - Get programme by ID
    fastify.get(
        '/api/v1/programmes/:id',
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
            const programme = await manageProgrammes.getProgrammeById(request.params.id);
            return { data: programme };
        },
    );

    // PATCH /api/v1/programmes/:id - Update programme
    fastify.patch(
        '/api/v1/programmes/:id',
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
                        description: { type: 'string', nullable: true },
                        effectiveFrom: { type: 'string', format: 'date-time', nullable: true },
                        effectiveTo: { type: 'string', format: 'date-time', nullable: true },
                        updatedBy: { type: 'string' },
                        changeReason: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateProgrammeInput }>) => {
            const programme = await manageProgrammes.updateProgramme(request.params.id, request.body);
            return { data: programme };
        },
    );

    // POST /api/v1/programmes/:id/publish - Publish programme
    fastify.post(
        '/api/v1/programmes/:id/publish',
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
                    required: ['publishedBy', 'publishReason'],
                    properties: {
                        publishedBy: { type: 'string' },
                        publishReason: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { id: string }; Body: PublishProgrammeInput }>) => {
            const programme = await manageProgrammes.publishProgramme(request.params.id, request.body);
            return { data: programme };
        },
    );
}
