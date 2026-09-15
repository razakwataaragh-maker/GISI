import { pathToFileURL } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { PrismaDatabaseConnection } from './infrastructure/database/database-connection.js';
import { createApplication, closeApplication } from './bootstrap/application.js';
import { loadConfiguration } from './bootstrap/configuration.js';

export interface ServerOptions {
    readonly environment?: NodeJS.ProcessEnv;
    readonly host?: string;
    readonly port?: number;
}

export async function startServer(
    options: ServerOptions = {},
): Promise<FastifyInstance> {
    const configuration = loadConfiguration({
        environment: options.environment ?? process.env,
    });

    const database = new PrismaDatabaseConnection({ url: configuration.database.url });
    const application = await createApplication({ configuration, database });
    const host = options.host ?? configuration.api.host;
    const port = options.port ?? configuration.api.port;

    await application.listen({ host, port });

    const shutdown = async (): Promise<void> => {
        await closeApplication(application, database);
        process.exit(0);
    };

    process.once('SIGINT', () => {
        void shutdown();
    });
    process.once('SIGTERM', () => {
        void shutdown();
    });

    return application;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    startServer().catch((error) => {
        console.error('Failed to start GISI server', error);
        process.exit(1);
    });
}
