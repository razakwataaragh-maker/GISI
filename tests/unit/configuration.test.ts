import { describe, expect, it } from 'vitest';
import {
    ConfigurationError,
    loadConfiguration,
    safeConfigurationSummary,
} from '../../src/bootstrap/configuration.js';
import { loadCognitoConfiguration } from '../../src/infrastructure/authentication/cognito-configuration.js';

const validEnvironment = {
    APP_NAME: 'gisi-test',
    APP_VERSION: '1.2.3',
    NODE_ENV: 'test',
    API_HOST: '127.0.0.1',
    API_PORT: '4000',
    DATABASE_URL: 'postgresql://gisi:secret@localhost:5432/gisi_test',
    LOG_LEVEL: 'debug',
    AUTH_PROVIDER: 'cognito',
};

const validCognitoEnvironment = {
    AWS_REGION: 'eu-west-1',
    AWS_USER_POOL_ID: 'eu-west-1_pool',
    AWS_CLIENT_ID: 'client-id',
};

describe('loadConfiguration', () => {
    it('loads and freezes generic application configuration', () => {
        const configuration = loadConfiguration({
            environment: validEnvironment,
        });

        expect(configuration.app.environment).toBe('test');
        expect(configuration.api.port).toBe(4000);
        expect(configuration.authentication).toEqual({ provider: 'cognito' });
        expect(Object.isFrozen(configuration)).toBe(true);
        expect(Object.isFrozen(configuration.api)).toBe(true);
    });

    it('uses safe defaults for non-secret optional settings', () => {
        const configuration = loadConfiguration({
            environment: {
                DATABASE_URL: validEnvironment.DATABASE_URL,
            },
        });

        expect(configuration.app.name).toBe('gisi');
        expect(configuration.api.host).toBe('127.0.0.1');
        expect(configuration.api.port).toBe(3000);
        expect(configuration.logging.level).toBe('info');
    });

    it('rejects missing generic required values', () => {
        expect(() =>
            loadConfiguration({
                environment: {
                    NODE_ENV: 'test',
                },
            }),
        ).toThrowError(ConfigurationError);
    });

    it('does not load or discover environment files', () => {
        const configuration = loadConfiguration({
            environment: validEnvironment,
        });

        expect(configuration.api.host).toBe('127.0.0.1');
        expect(configuration.authentication).toEqual({ provider: 'cognito' });
    });

    it('rejects invalid generic values and formats', () => {
        expect(() =>
            loadConfiguration({
                environment: {
                    ...validEnvironment,
                    API_PORT: '70000',
                    DATABASE_URL: 'mysql://localhost/gisi',
                    LOG_LEVEL: 'verbose',
                },
            }),
        ).toThrowError(/API_PORT.*PostgreSQL|LOG_LEVEL/);
    });

    it('keeps Cognito configuration behind the authentication infrastructure boundary', () => {
        const configuration = loadConfiguration({ environment: validEnvironment });
        const cognito = loadCognitoConfiguration(validCognitoEnvironment);

        expect(configuration.authentication).toEqual({ provider: 'cognito' });
        expect(cognito).toEqual({
            region: validCognitoEnvironment.AWS_REGION,
            userPoolId: validCognitoEnvironment.AWS_USER_POOL_ID,
            clientId: validCognitoEnvironment.AWS_CLIENT_ID,
        });
        expect(Object.isFrozen(cognito)).toBe(true);
    });

    it('rejects missing Cognito infrastructure values without exposing values', () => {
        expect(() => loadCognitoConfiguration({ AWS_REGION: 'eu-west-1' })).toThrowError(
            /AWS_USER_POOL_ID is required for Cognito authentication/,
        );
    });

    it('does not expose database credentials in summaries or errors', () => {
        const configuration = loadConfiguration({
            environment: validEnvironment,
        });
        const summary = JSON.stringify(safeConfigurationSummary(configuration));

        expect(summary).not.toContain('secret');
        expect(summary).toContain('[REDACTED]');

        try {
            loadConfiguration({
                environment: {
                    ...validEnvironment,
                    DATABASE_URL: '',
                },
            });
        } catch (error) {
            expect((error as Error).message).not.toContain('secret');
        }
    });
});
