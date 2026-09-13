import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { loadConfiguration } from '../../src/bootstrap/configuration.js';
import { apiErrorBoundaryPlugin } from '../../src/infrastructure/http/api-error-boundary.js';
import { correlationIdPlugin } from '../../src/infrastructure/http/correlation-id.js';
import { createLogger } from '../../src/infrastructure/logging/logger.js';
import { versionEndpointPlugin } from '../../src/infrastructure/http/version-endpoint.js';

const configuration = loadConfiguration({
    environment: {
        APP_NAME: 'gisi-test',
        APP_VERSION: '1.2.3',
        NODE_ENV: 'test',
        API_HOST: '127.0.0.1',
        API_PORT: '4000',
        DATABASE_URL: 'postgresql://gisi:test@localhost:5432/gisi_test',
        LOG_LEVEL: 'info',
        AUTH_PROVIDER: 'cognito',
    },
});

describe('version endpoint', () => {
    it('returns only the approved public build metadata without authentication', async () => {
        const application = Fastify();
        const logger = createLogger({
            level: 'info',
            name: 'gisi',
            version: configuration.app.version,
            environment: 'test',
        });
        await application.register(correlationIdPlugin(logger));
        await application.register(apiErrorBoundaryPlugin(logger));
        await application.register(versionEndpointPlugin(configuration));

        const response = await application.inject({
            method: 'GET',
            url: '/version',
            headers: { 'x-correlation-id': 'version-request-1' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            name: 'gisi-test',
            version: '1.2.3',
            buildIdentity: 'gisi-test@1.2.3',
        });
        expect(Object.keys(response.json()).sort()).toEqual(['buildIdentity', 'name', 'version']);
        expect(response.headers['x-correlation-id']).toBe('version-request-1');
        await application.close();
    });
});
