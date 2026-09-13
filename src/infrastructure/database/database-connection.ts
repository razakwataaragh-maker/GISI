import { PrismaClient } from '@prisma/client';

export interface DatabaseReadiness {
    readonly ready: boolean;
    readonly dependency: 'postgresql';
}

export interface DatabaseConnection {
    connect(): Promise<void>;
    checkReadiness(): Promise<DatabaseReadiness>;
    disconnect(): Promise<void>;
}

interface PrismaClientPort {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRawUnsafe(query: string, ...values: readonly unknown[]): Promise<unknown>;
}

export interface DatabaseConnectionOptions {
    readonly url: string;
    readonly connectionLimit?: number;
    readonly poolTimeoutSeconds?: number;
    readonly connectTimeoutSeconds?: number;
}

export class DatabaseConnectionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseConnectionError';
    }
}

const defaultOptions = {
    connectionLimit: 10,
    poolTimeoutSeconds: 10,
    connectTimeoutSeconds: 10,
} as const;

function databaseUrl(options: DatabaseConnectionOptions): string {
    const parsed = new URL(options.url);
    parsed.searchParams.set('connection_limit', String(options.connectionLimit ?? defaultOptions.connectionLimit));
    parsed.searchParams.set('pool_timeout', String(options.poolTimeoutSeconds ?? defaultOptions.poolTimeoutSeconds));
    parsed.searchParams.set('connect_timeout', String(options.connectTimeoutSeconds ?? defaultOptions.connectTimeoutSeconds));
    return parsed.toString();
}

export class PrismaDatabaseConnection implements DatabaseConnection {
    private readonly client: PrismaClientPort;
    private connected = false;

    constructor(options: DatabaseConnectionOptions, clientFactory: (url: string) => PrismaClientPort = createPrismaClient) {
        this.client = clientFactory(databaseUrl(options));
    }

    async connect(): Promise<void> {
        try {
            await this.client.$connect();
            this.connected = true;
        } catch {
            throw new DatabaseConnectionError('PostgreSQL connection failed');
        }
    }

    async checkReadiness(): Promise<DatabaseReadiness> {
        if (!this.connected) {
            return { dependency: 'postgresql', ready: false };
        }

        try {
            await this.client.$queryRawUnsafe('SELECT 1');
            return { dependency: 'postgresql', ready: true };
        } catch {
            return { dependency: 'postgresql', ready: false };
        }
    }

    async disconnect(): Promise<void> {
        if (!this.connected) {
            return;
        }

        await this.client.$disconnect();
        this.connected = false;
    }
}

function createPrismaClient(url: string): PrismaClientPort {
    const client = new PrismaClient({ datasourceUrl: url });
    return {
        $connect: () => client.$connect(),
        $disconnect: () => client.$disconnect(),
        $queryRawUnsafe: (query, ...values) => client.$queryRawUnsafe(query, ...values),
    };
}
