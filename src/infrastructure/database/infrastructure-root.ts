import { PrismaClient } from '@prisma/client';
import type { ApplicationConfiguration } from '../../bootstrap/configuration.js';
import { PrismaAuditWriter } from '../../modules/audit/infrastructure/prisma-audit-writer.js';

export interface InfrastructureRoot {
    readonly prisma: PrismaClient;
    readonly auditWriter: PrismaAuditWriter;
}

export function createInfrastructureRoot(
    configuration: ApplicationConfiguration,
): InfrastructureRoot {
    const prisma = new PrismaClient({
        datasourceUrl: configuration.database.url,
    });

    const auditWriter = new PrismaAuditWriter(prisma);

    return {
        prisma,
        auditWriter,
    };
}

export async function shutdownInfrastructureRoot(
    root: InfrastructureRoot,
): Promise<void> {
    await root.prisma.$disconnect();
}
