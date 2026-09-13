const environments = ['development', 'test', 'staging', 'production'] as const;
const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
const authProviders = ['cognito'] as const;

export type ApplicationEnvironment = (typeof environments)[number];
export type LogLevel = (typeof logLevels)[number];
export type AuthenticationProvider = (typeof authProviders)[number];
export type EnvironmentVariables = Readonly<Record<string, string | undefined>>;

export interface ApplicationConfiguration {
    readonly app: {
        readonly name: string;
        readonly version: string;
        readonly environment: ApplicationEnvironment;
    };
    readonly api: {
        readonly host: string;
        readonly port: number;
    };
    readonly database: {
        readonly url: string;
    };
    readonly logging: {
        readonly level: LogLevel;
    };
    readonly authentication: {
        readonly provider: AuthenticationProvider;
    };
}

export interface ConfigurationLoadOptions {
    readonly environment?: EnvironmentVariables;
}

export class ConfigurationError extends Error {
    readonly issues: readonly string[];

    constructor(issues: readonly string[]) {
        super(`Invalid application configuration: ${issues.join('; ')}`);
        this.name = 'ConfigurationError';
        this.issues = issues;
    }
}

const defaults = {
    APP_NAME: 'gisi',
    APP_VERSION: '0.1.0',
    NODE_ENV: 'development',
    API_HOST: '127.0.0.1',
    API_PORT: '3000',
    LOG_LEVEL: 'info',
    AUTH_PROVIDER: 'cognito',
} as const;

function value(
    environment: EnvironmentVariables,
    key: string,
): string | undefined {
    const candidate = environment[key]?.trim();
    return candidate === '' ? undefined : candidate;
}

function required(
    environment: EnvironmentVariables,
    key: string,
    issues: string[],
): string | undefined {
    const candidate = value(environment, key);
    if (!candidate) {
        issues.push(`${key} is required`);
    }
    return candidate;
}

function oneOf<T extends string>(
    environment: EnvironmentVariables,
    key: string,
    allowed: readonly T[],
    issues: string[],
): T | undefined {
    const candidate = value(environment, key);
    if (!candidate) {
        issues.push(`${key} is required`);
        return undefined;
    }

    if (!allowed.includes(candidate as T)) {
        issues.push(`${key} must be one of: ${allowed.join(', ')}`);
        return undefined;
    }

    return candidate as T;
}

function port(
    environment: EnvironmentVariables,
    issues: string[],
): number | undefined {
    const raw = required(environment, 'API_PORT', issues);
    if (!raw) {
        return undefined;
    }

    if (!/^\d+$/.test(raw)) {
        issues.push('API_PORT must be an integer between 1 and 65535');
        return undefined;
    }

    const parsed = Number(raw);
    if (parsed < 1 || parsed > 65535) {
        issues.push('API_PORT must be an integer between 1 and 65535');
        return undefined;
    }

    return parsed;
}

function databaseUrl(
    environment: EnvironmentVariables,
    issues: string[],
): string | undefined {
    const candidate = required(environment, 'DATABASE_URL', issues);
    if (!candidate) {
        return undefined;
    }

    try {
        const parsed = new URL(candidate);
        if (
            parsed.protocol !== 'postgresql:' &&
            parsed.protocol !== 'postgres:'
        ) {
            throw new Error('unsupported protocol');
        }
    } catch {
        issues.push('DATABASE_URL must be a valid PostgreSQL connection URL');
        return undefined;
    }

    return candidate;
}

function freeze<T>(valueToFreeze: T): Readonly<T> {
    if (valueToFreeze !== null && typeof valueToFreeze === 'object') {
        Object.freeze(valueToFreeze);
        for (const nestedValue of Object.values(
            valueToFreeze as Record<string, unknown>,
        )) {
            freeze(nestedValue);
        }
    }
    return valueToFreeze;
}

function withDefaults(environment: EnvironmentVariables): EnvironmentVariables {
    return {
        ...defaults,
        ...environment,
    };
}

export function loadConfiguration(
    options: ConfigurationLoadOptions = {},
): ApplicationConfiguration {
    const environment = withDefaults(options.environment ?? process.env);
    const issues: string[] = [];
    const applicationEnvironment = oneOf(
        environment,
        'NODE_ENV',
        environments,
        issues,
    );
    const level = oneOf(environment, 'LOG_LEVEL', logLevels, issues);
    const provider = oneOf(environment, 'AUTH_PROVIDER', authProviders, issues);
    const url = databaseUrl(environment, issues);
    const apiPort = port(environment, issues);
    const appName = required(environment, 'APP_NAME', issues);
    const appVersion = required(environment, 'APP_VERSION', issues);
    const apiHost = required(environment, 'API_HOST', issues);

    if (issues.length > 0) {
        throw new ConfigurationError(issues);
    }

    return freeze({
        app: {
            name: appName!,
            version: appVersion!,
            environment: applicationEnvironment!,
        },
        api: {
            host: apiHost!,
            port: apiPort!,
        },
        database: {
            url: url!,
        },
        logging: {
            level: level!,
        },
        authentication: {
            provider: provider!,
        },
    });
}

export function safeConfigurationSummary(
    configuration: ApplicationConfiguration,
): Record<string, unknown> {
    return {
        app: configuration.app,
        api: configuration.api,
        database: { url: '[REDACTED]' },
        logging: configuration.logging,
        authentication: configuration.authentication,
    };
}
