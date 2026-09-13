export type AuditJsonValue =
    | string
    | number
    | boolean
    | null
    | AuditJsonValue[]
    | { readonly [key: string]: AuditJsonValue };

export interface AuditEventInput {
    readonly eventName: string;
    readonly category: string;
    readonly actorId?: string;
    readonly actorType: string;
    readonly targetType: string;
    readonly targetId?: string;
    readonly action: string;
    readonly outcome: string;
    readonly occurredAt?: Date;
    readonly correlationId?: string;
    readonly owningModule: string;
    readonly sourceBoundary: string;
    readonly reason?: string;
    readonly changeReference?: string;
    readonly beforeState?: AuditJsonValue;
    readonly afterState?: AuditJsonValue;
}

export interface AuditEvent extends AuditEventInput {
    readonly id: string;
    readonly occurredAt: Date;
    readonly recordedAt: Date;
}

export interface AuditWriter {
    append(event: AuditEventInput): Promise<AuditEvent>;
}
