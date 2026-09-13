import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../../src/infrastructure/logging/logger.js';

function captureLogs(): { stream: Writable; output: () => string } {
    let content = '';
    const stream = new Writable({
        write(chunk, _encoding, callback) {
            content += chunk.toString();
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

        logger.child({ module: 'configuration', action: 'load', event: 'started' }).info('Configuration loaded');

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
                DATABASE_URL: 'postgresql://user:secret@localhost/db',
                authorization: 'Bearer secret-token',
                safeValue: 'retained',
            },
            'Sensitive values supplied',
        );

        const record = JSON.parse(captured.output()) as Record<string, unknown>;
        expect(record).toMatchObject({
            password: '[REDACTED]',
            token: '[REDACTED]',
            DATABASE_URL: '[REDACTED]',
            authorization: '[REDACTED]',
            safeValue: 'retained',
        });
        expect(captured.output()).not.toContain('password-value');
        expect(captured.output()).not.toContain('secret-token');
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
