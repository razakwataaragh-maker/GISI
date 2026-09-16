import { describe, expect, it } from 'vitest';
import { AuditEventValidationError } from '../../src/modules/audit/application/validate-audit-event.js';
import {
    PrismaAuditWriter,
    PrismaAuditWriterError,
} from '../../src/modules/audit/infrastructure/prisma-audit-writer.js';

const event = {
    eventName: 'record_created',
    category: 'administrative',
    actorId: 'actor-1',
    actorType: 'user',
    targetType: 'record',
    targetId: 'record-1',
    action: 'create',
    outcome: 'success',
    occurredAt: new Date('2026-09-13T17:00:00.000Z'),
    correlationId: 'correlation-1',
    owningModule: 'example',
    sourceBoundary: 'application',
    reason: 'test',
    beforeState: { state: 'missing' },
    afterState: { state: 'created' },
} as const;

describe('PrismaAuditWriter', () => {
    it('appends a safe audit event', async () => {
        const stored = {
            id: 'event-1',
            ...event,
            actorId: event.actorId,
            targetId: event.targetId,
            recordedAt: new Date('2026-09-13T17:00:01.000Z'),
            changeReference: null,
            beforeState: event.beforeState,
            afterState: event.afterState,
        };
        const store: ConstructorParameters<typeof PrismaAuditWriter>[0] = {
            auditEvent: {
                create: async ({ data }) => ({
                    ...stored,
                    ...data,
                }),
            },
        };
        const writer = new PrismaAuditWriter(store);

        const result = await writer.append(event);
        expect(result).toMatchObject({
            eventName: 'record_created',
            correlationId: 'correlation-1',
        });
        expect(result.id).toEqual(expect.any(String));
    });

    it('rejects prohibited fields in state', async () => {
        const store = {
            auditEvent: { create: async () => undefined },
        } as never;
        const writer = new PrismaAuditWriter(store);

        await expect(
            writer.append({
                ...event,
                afterState: { token: 'must-not-be-stored' },
            }),
        ).rejects.toBeInstanceOf(AuditEventValidationError);
    });

    it('exposes append only on the writer contract', () => {
        const store = {
            auditEvent: { create: async () => undefined },
        } as never;
        const writer = new PrismaAuditWriter(store);

        expect('update' in writer).toBe(false);
        expect('delete' in writer).toBe(false);
    });

    it('creates transactional writer via static method', () => {
        const store = {
            auditEvent: { create: async () => undefined },
        } as never;
        const writer = PrismaAuditWriter.transactional(store);

        expect(writer).toBeInstanceOf(PrismaAuditWriter);
        expect('update' in writer).toBe(false);
        expect('delete' in writer).toBe(false);
    });

    it('wraps database errors in PrismaAuditWriterError', async () => {
        const store = {
            auditEvent: {
                create: async () => {
                    throw new Error('Database connection failed');
                },
            },
        } as never;
        const writer = new PrismaAuditWriter(store);

        await expect(writer.append(event)).rejects.toBeInstanceOf(
            PrismaAuditWriterError,
        );
        await expect(writer.append(event)).rejects.toThrow(
            'Failed to persist audit event',
        );
    });
});
