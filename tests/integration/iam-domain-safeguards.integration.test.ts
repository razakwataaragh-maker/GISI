import { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

const enabled = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true';
const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!enabled)('IAM domain safeguards integration tests', () => {
    it('creates roles with rank field', async () => {
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is required for IAM integration tests');
        }

        const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
        const roleKey = `integration-role-rank-${crypto.randomUUID()}`;

        try {
            const role = await prisma.role.create({
                data: {
                    key: roleKey,
                    name: 'Test Role with Rank',
                    status: 'ACTIVE',
                    rank: 10,
                    createdBy: 'integration-test',
                    updatedBy: 'integration-test',
                    statusChangedAt: new Date(),
                    statusChangedBy: 'integration-test',
                    statusChangeReason: 'integration test',
                },
            });

            expect(role.rank).toBe(10);
            expect(role.key).toBe(roleKey);
        } finally {
            await prisma.role.deleteMany({ where: { key: roleKey } });
            await prisma.$disconnect();
        }
    });

    it('creates BootstrapControl table entry', async () => {
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is required for IAM integration tests');
        }

        const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
        const bootstrapId = `integration-bootstrap-${crypto.randomUUID()}`;

        try {
            const bootstrap = await prisma.bootstrapControl.create({
                data: {
                    id: bootstrapId,
                },
            });

            expect(bootstrap.id).toBe(bootstrapId);
            expect(bootstrap.consumedAt).toBeNull();
        } finally {
            await prisma.bootstrapControl.deleteMany({ where: { id: bootstrapId } });
            await prisma.$disconnect();
        }
    });
});
