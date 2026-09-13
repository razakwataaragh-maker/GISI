import type {
    AuditEventInput,
    AuditJsonValue,
} from '../domain/audit-writer.js';

const prohibitedFieldPattern =
    /password|token|secret|credential|connectionstring|connection_string|authorization|cookie|privatekey|private_key|providererror|provider_error|stacktrace|stack_trace/i;

export class AuditEventValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuditEventValidationError';
    }
}

export function validateAuditEvent(event: AuditEventInput): void {
    for (const [name, value] of Object.entries(event)) {
        if (prohibitedFieldPattern.test(name)) {
            throw new AuditEventValidationError(
                `Audit event contains prohibited field: ${name}`,
            );
        }
        if (value !== undefined && isJsonValue(value)) {
            validateJsonValue(value, name);
        }
    }
}

function validateJsonValue(value: AuditJsonValue, path: string): void {
    if (Array.isArray(value)) {
        value.forEach((item, index) =>
            validateJsonValue(item, `${path}[${index}]`),
        );
        return;
    }

    if (value !== null && typeof value === 'object') {
        for (const [name, nestedValue] of Object.entries(value)) {
            const nestedPath = `${path}.${name}`;
            if (prohibitedFieldPattern.test(name)) {
                throw new AuditEventValidationError(
                    `Audit event contains prohibited field: ${nestedPath}`,
                );
            }
            validateJsonValue(nestedValue, nestedPath);
        }
    }
}

function isJsonValue(value: unknown): value is AuditJsonValue {
    return (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        Array.isArray(value) ||
        typeof value === 'object'
    );
}
