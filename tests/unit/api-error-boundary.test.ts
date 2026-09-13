import Fastify from 'fastify';
import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import {
    apiErrorBoundaryPlugin,
    ApiError,
    type ApiErrorCode,
} from '../../src/infrastructure/http/api-error-boundary.js';
import { correlationIdPlugin } from '../../src/infrastructure/http/correlation-id.js';
import { createLogger } from '../../src/infrastructure/logging/logger.js';

function testLogger(): {
    logger: ReturnType<typeof createLogger>;
    output: () => string;
} {
    let content = '';
    const destination = new Writable({
        write(chunk, _encoding, callback) {
            content += String(chunk);
            callback();
        },
    });

    return {
        logger: createLogger({
            level: 'info',
            name: 'gisi',
            version: '1.0.0',
            environment: 'test',
            destination,
        }),
        output: () => content,
    };
}

describe('API error boundary', () => {
    it('returns validation details and the request correlation ID', async () => {
        const application = Fastify();
        const test = testLogger();
        await application.register(correlationIdPlugin(test.logger));
        await application.register(apiErrorBoundaryPlugin(test.logger));
        application.get('/validation', async () => {
            throw new ApiError('VALIDATION_ERROR', [
                { field: 'email', issue: 'must be valid' },
            ]);
        });

        const response = await application.inject({
            method: 'GET',
            url: '/validation',
            headers: { 'x-correlation-id': 'validation-request-1' },
        });

        expect(response.statusCode).toBe(422);
        expect(response.json()).toEqual({
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: [{ field: 'email', issue: 'must be valid' }],
            correlationId: 'validation-request-1',
        });
        expect(response.headers['x-correlation-id']).toBe(
            'validation-request-1',
        );
        await application.close();
    });

    it('maps all taxonomy codes to their standard statuses', async () => {
        const application = Fastify();
        const test = testLogger();
        await application.register(correlationIdPlugin(test.logger));
        await application.register(apiErrorBoundaryPlugin(test.logger));
        application.get<{ Params: { code: string } }>(
            '/errors/:code',
            async (request) => {
                throw new ApiError(request.params.code as ApiErrorCode);
            },
        );

        const cases = [
            ['BAD_REQUEST', 400],
            ['UNAUTHORIZED', 401],
            ['FORBIDDEN', 403],
            ['NOT_FOUND', 404],
            ['CONFLICT', 409],
            ['VALIDATION_ERROR', 422],
            ['BUSINESS_RULE_VIOLATION', 422],
            ['DEPENDENCY_ERROR', 500],
            ['PERSISTENCE_ERROR', 500],
            ['INTERNAL_ERROR', 500],
        ] as const;

        for (const [code, statusCode] of cases) {
            const response = await application.inject({
                method: 'GET',
                url: `/errors/${code}`,
            });
            expect(response.statusCode).toBe(statusCode);
            expect(response.json()).toMatchObject({ code, details: [] });
        }

        await application.close();
    });

    it('returns a safe internal error without leaking diagnostics', async () => {
        const application = Fastify();
        const test = testLogger();
        await application.register(correlationIdPlugin(test.logger));
        await application.register(apiErrorBoundaryPlugin(test.logger));
        application.get('/unexpected', async () => {
            throw new Error('database password at /srv/gisi/private/file.ts');
        });

        const response = await application.inject({
            method: 'GET',
            url: '/unexpected',
            headers: { 'x-correlation-id': 'unexpected-request-1' },
        });
        const body = response.body;

        expect(response.statusCode).toBe(500);
        expect(response.json()).toEqual({
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
            details: [],
            correlationId: 'unexpected-request-1',
        });
        expect(body).not.toContain('database password');
        expect(body).not.toContain('/srv/gisi/private/file.ts');
        expect(body).not.toContain('Error:');
        expect(test.output()).toContain('database password');
        await application.close();
    });
});
