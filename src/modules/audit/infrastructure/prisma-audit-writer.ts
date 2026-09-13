import { randomUUID } from 'node:crypto';
import type {
    AuditEvent,
    AuditEventInput,
    AuditJsonValue,
    AuditWriter,
} from '../domain/audit-writer.js';
import { validateAuditEvent } from '../application/validate-audit-event.js';

type AuditEventRecord = {
    id: string;
    eventName: string;
    category: string;
    actorId: string | null;
    actorType: string;
    targetType: string;
    targetId: string | null;
    action: string;
    outcome: string;
    occurredAt: Date;
    recordedAt: Date;
    correlationId: string | null;
    owningModule: string;
    sourceBoundary: string;
    reason: string | null;
    changeReference: string | null;
    beforeState: unknown;
    afterState: unknown;
};

type AuditEventStore = {
    readonly auditEvent: {
        create(args: {
            data: Record<string, unknown>;
        }): Promise<AuditEventRecord>;
    };
};

export class PrismaAuditWriter implements AuditWriter {
    constructor(private readonly store: AuditEventStore) {}

    async append(input: AuditEventInput): Promise<AuditEvent> {
        validateAuditEvent(input);
        const occurredAt = input.occurredAt ?? new Date();
        const data: Record<string, unknown> = {
            id: randomUUID(),
            eventName: input.eventName,
            category: input.category,
            actorType: input.actorType,
            targetType: input.targetType,
            action: input.action,
            outcome: input.outcome,
            occurredAt,
            owningModule: input.owningModule,
            sourceBoundary: input.sourceBoundary,
        };
        addOptional(data, 'actorId', input.actorId);
        addOptional(data, 'targetId', input.targetId);
        addOptional(data, 'correlationId', input.correlationId);
        addOptional(data, 'reason', input.reason);
        addOptional(data, 'changeReference', input.changeReference);
        addOptional(data, 'beforeState', input.beforeState);
        addOptional(data, 'afterState', input.afterState);

        const record = await this.store.auditEvent.create({ data });
        return mapRecord(record);
    }
}

function mapRecord(record: AuditEventRecord): AuditEvent {
    return {
        id: record.id,
        eventName: record.eventName,
        category: record.category,
        actorType: record.actorType,
        targetType: record.targetType,
        action: record.action,
        outcome: record.outcome,
        occurredAt: record.occurredAt,
        recordedAt: record.recordedAt,
        owningModule: record.owningModule,
        sourceBoundary: record.sourceBoundary,
        ...(record.actorId !== null ? { actorId: record.actorId } : {}),
        ...(record.targetId !== null ? { targetId: record.targetId } : {}),
        ...(record.correlationId !== null
            ? { correlationId: record.correlationId }
            : {}),
        ...(record.reason !== null ? { reason: record.reason } : {}),
        ...(record.changeReference !== null
            ? { changeReference: record.changeReference }
            : {}),
        ...(record.beforeState !== null && record.beforeState !== undefined
            ? {
                  beforeState: record.beforeState as AuditJsonValue,
              }
            : {}),
        ...(record.afterState !== null && record.afterState !== undefined
            ? {
                  afterState: record.afterState as AuditJsonValue,
              }
            : {}),
    };
}

function addOptional(
    data: Record<string, unknown>,
    key: string,
    value: unknown,
): void {
    if (value !== undefined) data[key] = value;
}
