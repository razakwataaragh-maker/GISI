import pino, {
    type Logger,
    type LoggerOptions as PinoLoggerOptions,
} from 'pino';
import type { ApplicationConfiguration } from '../../bootstrap/configuration.js';

export type LogLevel = ApplicationConfiguration['logging']['level'];

export interface LogContext {
    readonly module?: string;
    readonly action?: string;
    readonly correlationId?: string;
    readonly userId?: string;
    readonly event?: string;
    readonly [key: string]: unknown;
}

export interface ApplicationLogger {
    readonly trace: Logger['trace'];
    readonly debug: Logger['debug'];
    readonly info: Logger['info'];
    readonly warn: Logger['warn'];
    readonly error: Logger['error'];
    readonly fatal: Logger['fatal'];
    child(context: LogContext): ApplicationLogger;
}

const redactedPaths = [
    '*.password',
    '*.token',
    '*.accessToken',
    '*.refreshToken',
    '*.clientSecret',
    '*.authorization',
    '*.cookie',
    '*.DATABASE_URL',
    '*.databaseUrl',
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'clientSecret',
    'authorization',
    'cookie',
    'DATABASE_URL',
    'databaseUrl',
] as const;

export interface LoggerOptions {
    readonly level: LogLevel;
    readonly name: string;
    readonly version: string;
    readonly environment: string;
    readonly destination?: NodeJS.WritableStream;
}

export function createLogger(options: LoggerOptions): ApplicationLogger {
    const pinoOptions: PinoLoggerOptions = {
        level: options.level,
        base: {
            service: options.name,
            version: options.version,
            environment: options.environment,
        },
        redact: {
            paths: [...redactedPaths],
            censor: '[REDACTED]',
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        messageKey: 'message',
        formatters: {
            level: (label) => ({ level: label }),
        },
    };

    const logger = pino(pinoOptions, options.destination);
    return wrapLogger(logger);
}

function wrapLogger(logger: Logger): ApplicationLogger {
    return {
        trace: logger.trace.bind(logger),
        debug: logger.debug.bind(logger),
        info: logger.info.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger),
        fatal: logger.fatal.bind(logger),
        child: (context) => wrapLogger(logger.child(context)),
    };
}
