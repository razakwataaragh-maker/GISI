import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
    PrismaDatabaseConnection,
    type DatabaseConnection,
} from '../infrastructure/database/database-connection.js';
import { apiErrorBoundaryPlugin } from '../infrastructure/http/api-error-boundary.js';
import { correlationIdPlugin } from '../infrastructure/http/correlation-id.js';
import { healthEndpointsPlugin } from '../infrastructure/http/health-endpoints.js';
import { versionEndpointPlugin } from '../infrastructure/http/version-endpoint.js';
import { createLogger } from '../infrastructure/logging/logger.js';
import { PrismaAuditWriter } from '../modules/audit/infrastructure/prisma-audit-writer.js';
import { studentRoutesPlugin } from '../modules/student/api/student-routes.js';
import { ManageStudents } from '../modules/student/application/manage-students.js';
import type { StudentAuthorization } from '../modules/student/contracts/student-profile.js';
import { PrismaStudentRepository } from '../modules/student/infrastructure/prisma-student-repository.js';
import { loadConfiguration, type ApplicationConfiguration } from './configuration.js';

export interface ApplicationOptions {
    readonly configuration?: ApplicationConfiguration;
    readonly prisma?: PrismaClient;
    readonly database?: DatabaseConnection;
    readonly authorization?: StudentAuthorization;
    readonly auditWriter?: PrismaAuditWriter;
}

export async function createApplication(
    options: ApplicationOptions = {},
): Promise<FastifyInstance> {
    const configuration =
        options.configuration ?? loadConfiguration();
    const logger = createLogger({
        level: configuration.logging.level,
        name: configuration.app.name,
        version: configuration.app.version,
        environment: configuration.app.environment,
    });

    const prisma =
        options.prisma ??
        new PrismaClient({
            datasourceUrl: configuration.database.url,
        });
    const database =
        options.database ??
        new PrismaDatabaseConnection({ url: configuration.database.url });

    const auditWriter =
        options.auditWriter ?? new PrismaAuditWriter(prisma as never);
    const authorization =
        options.authorization ?? {
            authorize: async () => true,
        };

    const studentRepository = new PrismaStudentRepository(prisma as never);
    const service = new ManageStudents({
        studentRepository,
        authorization,
        auditWriter,
    });

    const app = Fastify({
        logger: false,
    });

    await app.register(correlationIdPlugin(logger));
    await app.register(apiErrorBoundaryPlugin(logger));
    await app.register(healthEndpointsPlugin(database));
    await app.register(versionEndpointPlugin(configuration));
    await app.register(studentRoutesPlugin({ service }));

    return app;
}

export async function closeApplication(
    application: FastifyInstance,
    database?: DatabaseConnection,
): Promise<void> {
    await application.close();
    if (database !== undefined) {
        await database.disconnect();
    }
}
