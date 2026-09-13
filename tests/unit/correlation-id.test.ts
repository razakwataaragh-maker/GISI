import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../../src/infrastructure/logging/logger.js';
import {
    correlationIdHeader,
    correlationIdPlugin,
    isValidCorrelationId,
    resolveCorrelationId,
} from '../../src/infrastructure/http/correlation-id.js';

describe('correlation identifiers', () => {
    it('accepts bounded safe caller identifiers and rejects unsafe values', () => {
        expect(isValidCorrelationId('upstream-123')).toBe(true);
        expect(isValidCorrelationId('a'.repeat(129))).toBe(false);
        expect(isValidCorrelationId('unsafe value')).toBe(false);
        expect(isValidCorrelationId(undefined)).toBe(false);
    });

    it('generates a UUID when the caller does not supply a valid identifier', () => {
        const correlationId = resolveCorrelationId(undefined);

        expect(correlationId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
    });

    it('propagates the caller identifier to the request, logger context, and response', async () => {
        const application = Fastify();
        const logger = createLogger({
            level: 'info',
            name: 'gisi',
            version: '1.0.0',
            environment: 'test',
        });
        await application.register(correlationIdPlugin(logger));
        application.get('/test', async (request) => {
            if (request.applicationLogger === null) {
                throw new Error('Expected request logger');
            }
            return {
                correlationId: request.correlationId,
                hasScopedLogger:
                    typeof request.applicationLogger.info === 'function',
            };
        });

        const response = await application.inject({
            method: 'GET',
            url: '/test',
            headers: { [correlationIdHeader]: 'upstream-123' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers[correlationIdHeader.toLowerCase()]).toBe(
            'upstream-123',
        );
        expect(response.json()).toEqual({
            correlationId: 'upstream-123',
            hasScopedLogger: true,
        });
        await application.close();
    });

    it('replaces an invalid caller identifier with a generated response identifier', async () => {
        const application = Fastify();
        const logger = createLogger({
            level: 'info',
            name: 'gisi',
            version: '1.0.0',
            environment: 'test',
        });
        await application.register(correlationIdPlugin(logger));
        application.get('/test', async (request) => ({
            correlationId: request.correlationId,
        }));

        const response = await application.inject({
            method: 'GET',
            url: '/test',
            headers: { [correlationIdHeader]: 'invalid correlation id' },
        });

        const correlationId =
            response.headers[correlationIdHeader.toLowerCase()];
        expect(correlationId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
        expect(response.json()).toEqual({ correlationId });
        await application.close();
    });
});
