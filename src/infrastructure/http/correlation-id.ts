import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import type { ApplicationLogger } from '../logging/logger.js';

export const correlationIdHeader = 'X-Correlation-ID';
const correlationIdPattern = /^[A-Za-z0-9._:-]{1,128}$/;

declare module 'fastify' {
    interface FastifyRequest {
        correlationId: string;
        applicationLogger: ApplicationLogger | null;
    }
}

export function isValidCorrelationId(
    value: string | undefined,
): value is string {
    return value !== undefined && correlationIdPattern.test(value);
}

export function resolveCorrelationId(value: string | undefined): string {
    return isValidCorrelationId(value) ? value : randomUUID();
}

export function correlationIdPlugin(
    logger: ApplicationLogger,
): FastifyPluginAsync {
    return fastifyPlugin(async (fastify) => {
        fastify.decorateRequest('correlationId', '');
        fastify.decorateRequest('applicationLogger', null);

        fastify.addHook('onRequest', async (request, reply) => {
            const header = request.headers[correlationIdHeader.toLowerCase()];
            const suppliedCorrelationId =
                typeof header === 'string' ? header : undefined;
            const correlationId = resolveCorrelationId(suppliedCorrelationId);
            request.correlationId = correlationId;
            request.applicationLogger = logger.child({ correlationId });
            reply.header(correlationIdHeader, correlationId);
        });
    });
}

export function requestCorrelationId(request: FastifyRequest): string {
    return request.correlationId;
}
