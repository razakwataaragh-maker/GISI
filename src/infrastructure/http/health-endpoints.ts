import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import type { DatabaseConnection } from '../database/database-connection.js';

export interface HealthResponse {
    readonly status: 'ok';
}

export interface ReadinessResponse {
    readonly status: 'ok' | 'not_ready';
    readonly ready: boolean;
    readonly dependencies: Readonly<Record<string, boolean>>;
}

export function healthEndpointsPlugin(
    database: DatabaseConnection,
): FastifyPluginAsync {
    return fastifyPlugin(async (fastify) => {
        fastify.get('/health', async (): Promise<HealthResponse> => ({
            status: 'ok',
        }));

        fastify.get(
            '/health/ready',
            async (_request, reply): Promise<ReadinessResponse> => {
                const databaseReadiness = await database.checkReadiness();
                const ready = databaseReadiness.ready;
                const response: ReadinessResponse = {
                    status: ready ? 'ok' : 'not_ready',
                    ready,
                    dependencies: {
                        [databaseReadiness.dependency]: ready,
                    },
                };

                if (!ready) {
                    reply.code(503);
                }

                return response;
            },
        );
    });
}
