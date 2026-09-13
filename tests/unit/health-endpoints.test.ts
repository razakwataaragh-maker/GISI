import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { apiErrorBoundaryPlugin } from '../../src/infrastructure/http/api-error-boundary.js';
import { correlationIdPlugin } from '../../src/infrastructure/http/correlation-id.js';
import type { DatabaseConnection } from '../../src/infrastructure/database/database-connection.js';
import { healthEndpointsPlugin } from '../../src/infrastructure/http/health-endpoints.js';
import { createLogger } from '../../src/infrastructure/logging/logger.js';

async function createApplication(database: DatabaseConnection) {
    const application = Fastify();
    const logger = createLogger({
        level: 'info',
        name: 'gisi',
        version: '1.0.0',
        environment: 'test',
    });

    await application.register(correlationIdPlugin(logger));
    await application.register(apiErrorBoundaryPlugin(logger));
    await application.register(healthEndpointsPlugin(database));
    return application;
}

describe('health endpoints', () => {
    it('returns a dependency-free liveness response', async () => {
        const database: DatabaseConnection = {
            connect: vi.fn(),
            checkReadiness: vi.fn(),
            disconnect: vi.fn(),
        };
        const application = await createApplication(database);

        const response = await application.inject({
            method: 'GET',
            url: '/health',
            headers: { 'x-correlation-id': 'health-request-1' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ status: 'ok' });
        expect(database.checkReadiness).not.toHaveBeenCalled();
        expect(response.headers['x-correlation-id']).toBe('health-request-1');
        await application.close();
    });

    it('returns ready when the database reports readiness', async () => {
        const database: DatabaseConnection = {
            connect: vi.fn(),
            checkReadiness: vi
                .fn()
                .mockResolvedValue({ dependency: 'postgresql', ready: true }),
            disconnect: vi.fn(),
        };
        const application = await createApplication(database);

        const response = await application.inject({
            method: 'GET',
            url: '/health/ready',
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            status: 'ok',
            ready: true,
            dependencies: { postgresql: true },
        });
        expect(database.checkReadiness).toHaveBeenCalledOnce();
        await application.close();
    });

    it('returns service unavailable when the database is not ready', async () => {
        const database: DatabaseConnection = {
            connect: vi.fn(),
            checkReadiness: vi
                .fn()
                .mockResolvedValue({ dependency: 'postgresql', ready: false }),
            disconnect: vi.fn(),
        };
        const application = await createApplication(database);

        const response = await application.inject({
            method: 'GET',
            url: '/health/ready',
        });

        expect(response.statusCode).toBe(503);
        expect(response.json()).toEqual({
            status: 'not_ready',
            ready: false,
            dependencies: { postgresql: false },
        });
        await application.close();
    });
});
