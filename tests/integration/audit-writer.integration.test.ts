import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaAuditWriter } from '../../src/modules/audit/infrastructure/prisma-audit-writer.js';
import type { AuditEventInput } from '../../src/modules/audit/domain/audit-writer.js';

describe('PrismaAuditWriter Integration', () => {
    describe('with database connection', () => {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            // Skip these tests if no database URL is provided
            it.skip('writes audit event to database and retrieves it', () => {});
            it.skip('rejects events with prohibited fields in nested state', () => {});
            it.skip('tests correlation ID propagation', () => {});
            it.skip('persists JSONB state fields correctly', () => {});
            return;
        }

        it('writes audit event to database and retrieves it', async () => {
            const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
            const writer = new PrismaAuditWriter(prisma);

            const event: AuditEventInput = {
                eventName: 'test_event',
                category: 'security',
                actorId: 'user-1',
                actorType: 'user',
                targetType: 'user',
                targetId: 'user-2',
                action: 'test_action',
                outcome: 'success',
                correlationId: 'test-correlation-1',
                owningModule: 'test',
                sourceBoundary: 'application',
                reason: 'integration test',
                beforeState: { status: 'old' },
                afterState: { status: 'new' },
            };

            const result = await writer.append(event);

            expect(result).toMatchObject({
                eventName: 'test_event',
                category: 'security',
                actorId: 'user-1',
                actorType: 'user',
                targetType: 'user',
                targetId: 'user-2',
                action: 'test_action',
                outcome: 'success',
                correlationId: 'test-correlation-1',
                owningModule: 'test',
                sourceBoundary: 'application',
                reason: 'integration test',
            });
            expect(result.id).toBeDefined();
            expect(result.occurredAt).toBeInstanceOf(Date);
            expect(result.recordedAt).toBeInstanceOf(Date);

            // Note: We don't clean up because audit_events is append-only
            await prisma.$disconnect();
        });

        it('rejects events with prohibited fields in nested state', async () => {
            const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
            const writer = new PrismaAuditWriter(prisma);

            const event: AuditEventInput = {
                eventName: 'test_event',
                category: 'security',
                actorType: 'user',
                targetType: 'user',
                action: 'test_action',
                outcome: 'success',
                owningModule: 'test',
                sourceBoundary: 'application',
                afterState: { secret: 'must-not-be-stored' },
            };

            await expect(writer.append(event)).rejects.toThrow('prohibited field');

            await prisma.$disconnect();
        });

        it('tests correlation ID propagation', async () => {
            const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
            const writer = new PrismaAuditWriter(prisma);

            const correlationId = 'test-correlation-12345';
            const event: AuditEventInput = {
                eventName: 'correlation_test',
                category: 'security',
                actorId: 'user-1',
                actorType: 'user',
                targetType: 'user',
                action: 'test',
                outcome: 'success',
                correlationId,
                owningModule: 'test',
                sourceBoundary: 'application',
            };

            const result = await writer.append(event);

            expect(result.correlationId).toBe(correlationId);

            // Verify we can query by correlation ID
            const events = await prisma.auditEvent.findMany({
                where: { correlationId },
            });
            expect(events).toHaveLength(1);
            expect(events[0]?.id).toBe(result.id);

            await prisma.$disconnect();
        });

        it('persists JSONB state fields correctly', async () => {
            const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
            const writer = new PrismaAuditWriter(prisma);

            const complexState = {
                user: { id: 'user-1', name: 'Test User' },
                changes: ['field1', 'field2'],
                metadata: { key: 'value', nested: { count: 42 } },
            };

            const event: AuditEventInput = {
                eventName: 'complex_state_event',
                category: 'administrative',
                actorType: 'user',
                targetType: 'configuration',
                action: 'update',
                outcome: 'success',
                owningModule: 'test',
                sourceBoundary: 'application',
                beforeState: complexState,
                afterState: { ...complexState, metadata: { key: 'updated' } },
            };

            const result = await writer.append(event);

            expect(result.beforeState).toEqual(complexState);
            expect(result.afterState).toEqual({
                ...complexState,
                metadata: { key: 'updated' },
            });

            // Note: We don't clean up because audit_events is append-only
            await prisma.$disconnect();
        });
    });
});
