import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../../src/infrastructure/logging/logger.js';

function captureLogs(): { stream: Writable; output: () => string } {
    let content = '';
    const stream = new Writable({
        write(chunk, _encoding, callback) {
            content += String(chunk);
            callback();
        },
    });
    return { stream, output: () => content };
}

describe('structured logger', () => {
    it('writes stable structured fields and module context', () => {
        const captured = captureLogs();
        const logger = createLogger({
            level: 'info',
            name: 'gisi',
            version: '1.0.0',
            environment: 'test',
            destination: captured.stream,
        });

        logger
            .child({
                module: 'configuration',
                action: 'load',
                event: 'started',
            })
            .info('Configuration loaded');

        const record = JSON.parse(captured.output()) as Record<string, unknown>;
        expect(record).toMatchObject({
            service: 'gisi',
            version: '1.0.0',
            environment: 'test',
            level: 'info',
            module: 'configuration',
            action: 'load',
            event: 'started',
            message: 'Configuration loaded',
        });
        expect(record.time).toEqual(expect.any(String));
    });

    it('redacts credentials and sensitive transport fields', () => {
        const captured = captureLogs();
        const logger = createLogger({
            level: 'info',
            name: 'gisi',
            version: '1.0.0',
            environment: 'test',
            destination: captured.stream,
        });

        logger.info(
            {
                password: 'password-value',
                token: 'token-value',
                accessToken: 'access-token-value',
                refreshToken: 'refresh-token-value',
                clientSecret: 'client-secret-value',
                DATABASE_URL: 'postgresql://user:password@localhost/db',
                databaseUrl: 'postgresql://user:password@localhost/db',
                authorization: 'Bearer token-value',
                nested: {
                    password: 'nested-password-value',
                    token: 'nested-token-value',
                },
                safeValue: 'retained',
            },
            'Sensitive values supplied',
        );

        const record = JSON.parse(captured.output()) as Record<string, unknown>;
        expect(record).toMatchObject({
            password: '[REDACTED]',
            token: '[REDACTED]',
            accessToken: '[REDACTED]',
            refreshToken: '[REDACTED]',
            clientSecret: '[REDACTED]',
            DATABASE_URL: '[REDACTED]',
            databaseUrl: '[REDACTED]',
            authorization: '[REDACTED]',
            safeValue: 'retained',
        });
        expect(captured.output()).not.toContain('password-value');
        expect(captured.output()).not.toContain('access-token-value');
        expect(captured.output()).not.toContain('refresh-token-value');
        expect(captured.output()).not.toContain('client-secret-value');
        expect(captured.output()).not.toContain(
            'postgresql://user:password@localhost/db',
        );
        expect(captured.output()).not.toContain('nested-password-value');
        expect(captured.output()).not.toContain('nested-token-value');
    });

    it('filters messages below the configured severity', () => {
        const captured = captureLogs();
        const logger = createLogger({
            level: 'warn',
            name: 'gisi',
            version: '1.0.0',
            environment: 'test',
            destination: captured.stream,
        });

        logger.info('hidden');
        logger.warn('visible');

        expect(captured.output()).not.toContain('hidden');
        expect(captured.output()).toContain('visible');
    });
});
