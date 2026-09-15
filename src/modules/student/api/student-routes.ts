import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import type { ManageStudents } from '../application/manage-students.js';
import type {
    CreateStudentProfileInput,
    StudentProfile,
    StudentProfileUpdateFields,
    StudentStatus,
    StudentStatusTransition,
    TransitionStudentStatusInput,
} from '../contracts/student-profile.js';

export interface StudentRoutesDependencies {
    readonly service: ManageStudents;
}

interface StudentCreateBody {
    readonly studentNumber: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone?: string | null;
    readonly nationalId?: string | null;
    readonly addressLine1?: string | null;
    readonly addressLine2?: string | null;
    readonly city?: string | null;
    readonly country?: string | null;
    readonly emergencyContactName?: string | null;
    readonly emergencyContactPhone?: string | null;
    readonly reason: string;
    readonly actor?: {
        readonly id: string;
        readonly type: 'user' | 'system' | 'service';
    };
    readonly correlationId?: string;
}

interface StudentUpdateBody {
    readonly changes: StudentProfileUpdateFields;
    readonly reason: string;
    readonly actor?: {
        readonly id: string;
        readonly type: 'user' | 'system' | 'service';
    };
    readonly correlationId?: string;
}

interface StudentStatusBody {
    readonly transition: StudentStatusTransition;
    readonly reason: string;
    readonly actor?: {
        readonly id: string;
        readonly type: 'user' | 'system' | 'service';
    };
    readonly correlationId?: string;
}

interface StudentDocumentBody {
    readonly name: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
    readonly reason?: string | undefined;
    readonly url?: string | undefined;
    readonly uploadedBy?: string | undefined;
    readonly actor?: {
        readonly id: string;
        readonly type: 'user' | 'system' | 'service';
    };
}

interface StudentIdParams {
    readonly id: string;
}

export const studentRoutesPlugin = (
    dependencies: StudentRoutesDependencies,
): FastifyPluginAsync =>
    fastifyPlugin(async (fastify) => {
        fastify.get('/students', async (request) => {
            const query = request.query as Record<string, string | undefined>;
            const actor = request.headers['x-actor-id']
                ? {
                      id: String(request.headers['x-actor-id']),
                      type: 'user' as const,
                  }
                : { id: 'system', type: 'system' as const };

            return dependencies.service.list(actor, {
                ...(query.status === undefined ? {} : { status: query.status as StudentStatus }),
                ...(query.studentNumber === undefined ? {} : { studentNumber: query.studentNumber }),
                ...(query.email === undefined ? {} : { email: query.email }),
            });
        });

        fastify.post('/students', async (request, reply) => {
            const body = request.body as StudentCreateBody;
            const actor = body.actor ?? {
                id: 'system',
                type: 'system' as const,
            };

            const input: CreateStudentProfileInput = {
                studentNumber: body.studentNumber,
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                phone: body.phone ?? null,
                nationalId: body.nationalId ?? null,
                addressLine1: body.addressLine1 ?? null,
                addressLine2: body.addressLine2 ?? null,
                city: body.city ?? null,
                country: body.country ?? null,
                emergencyContactName: body.emergencyContactName ?? null,
                emergencyContactPhone: body.emergencyContactPhone ?? null,
                actor,
                reason: body.reason,
                ...(body.correlationId === undefined
                    ? {}
                    : { correlationId: body.correlationId }),
            };

            const student = await dependencies.service.create(input);
            reply.code(201);
            return student;
        });

        fastify.get('/students/:id', async (request) => {
            const { id } = request.params as StudentIdParams;
            const actor = request.headers['x-actor-id']
                ? {
                      id: String(request.headers['x-actor-id']),
                      type: 'user' as const,
                  }
                : { id: 'system', type: 'system' as const };

            return dependencies.service.findById(id, actor);
        });

        fastify.get('/students/:id/history', async (request) => {
            const { id } = request.params as StudentIdParams;
            const actor = request.headers['x-actor-id']
                ? {
                      id: String(request.headers['x-actor-id']),
                      type: 'user' as const,
                  }
                : { id: 'system', type: 'system' as const };

            return dependencies.service.history(id, actor);
        });

        fastify.get('/students/:id/transcript', async (request) => {
            const { id } = request.params as StudentIdParams;
            const actor = request.headers['x-actor-id']
                ? {
                      id: String(request.headers['x-actor-id']),
                      type: 'user' as const,
                  }
                : { id: 'system', type: 'system' as const };

            return dependencies.service.transcript(id, actor);
        });

        fastify.post('/students/:id/documents', async (request) => {
            const { id } = request.params as StudentIdParams;
            const body = request.body as StudentDocumentBody;
            const actor = body.actor ?? {
                id: 'system',
                type: 'system' as const,
            };

            return dependencies.service.uploadDocument(id, actor, {
                name: body.name,
                mimeType: body.mimeType,
                sizeBytes: body.sizeBytes,
                reason: body.reason,
                url: body.url,
                uploadedBy: body.uploadedBy,
            });
        });

        fastify.patch('/students/:id', async (request) => {
            const { id } = request.params as StudentIdParams;
            const body = request.body as StudentUpdateBody;
            const actor = body.actor ?? {
                id: 'system',
                type: 'system' as const,
            };

            return dependencies.service.update({
                id,
                actor,
                changes: body.changes,
                reason: body.reason,
                ...(body.correlationId === undefined
                    ? {}
                    : { correlationId: body.correlationId }),
            });
        });

        fastify.post('/students/:id/status', async (request) => {
            const { id } = request.params as StudentIdParams;
            const body = request.body as StudentStatusBody;
            const actor = body.actor ?? {
                id: 'system',
                type: 'system' as const,
            };

            const input: TransitionStudentStatusInput = {
                id,
                transition: body.transition,
                actor,
                reason: body.reason,
                ...(body.correlationId === undefined
                    ? {}
                    : { correlationId: body.correlationId }),
            };

            return dependencies.service.transition(input);
        });
    });
