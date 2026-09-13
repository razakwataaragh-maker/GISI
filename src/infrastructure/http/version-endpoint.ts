import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import type { ApplicationConfiguration } from '../../bootstrap/configuration.js';

export interface VersionResponse {
    readonly name: string;
    readonly version: string;
    readonly buildIdentity: string;
}

function versionResponse(
    configuration: ApplicationConfiguration,
): VersionResponse {
    return {
        name: configuration.app.name,
        version: configuration.app.version,
        buildIdentity: `${configuration.app.name}@${configuration.app.version}`,
    };
}

export function versionEndpointPlugin(
    configuration: ApplicationConfiguration,
): FastifyPluginAsync {
    return fastifyPlugin(async (fastify) => {
        fastify.get('/version', async () => versionResponse(configuration));
    });
}
