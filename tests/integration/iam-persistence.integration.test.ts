import { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

const enabled = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true';
const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!enabled)('IAM persistence constraints', () => {
    it('rejects duplicate Cognito subjects', async () => {
        if (!databaseUrl) {
            throw new Error(
                'DATABASE_URL is required for IAM integration tests',
            );
        }

        const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
        const cognitoSubject = `integration-${crypto.randomUUID()}`;

        try {
            await prisma.user.create({
                data: {
                    cognitoSubject,
                    status: 'ACTIVE',
                    statusChangedAt: new Date(),
                    statusChangedBy: 'integration-test',
                    statusChangeReason: 'constraint test',
                },
            });

            await expect(
                prisma.user.create({
                    data: {
                        cognitoSubject,
                        status: 'ACTIVE',
                        statusChangedAt: new Date(),
                        statusChangedBy: 'integration-test',
                        statusChangeReason: 'constraint test',
                    },
                }),
            ).rejects.toThrow();
        } finally {
            await prisma.user.deleteMany({ where: { cognitoSubject } });
            await prisma.$disconnect();
        }
    });

    it('rejects a user row without required status fields', async () => {
        if (!databaseUrl) {
            throw new Error(
                'DATABASE_URL is required for IAM integration tests',
            );
        }

        const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

        try {
            await expect(
                prisma.$executeRawUnsafe(
                    'INSERT INTO "users" ("id", "cognito_subject", "created_at", "updated_at", "status_changed_at", "status_changed_by", "status_change_reason") VALUES ($1, $2, NOW(), NOW(), NOW(), $3, $4)',
                    crypto.randomUUID(),
                    `integration-${crypto.randomUUID()}`,
                    'integration-test',
                    'constraint test',
                ),
            ).rejects.toThrow();
        } finally {
            await prisma.$disconnect();
        }
    });
});
