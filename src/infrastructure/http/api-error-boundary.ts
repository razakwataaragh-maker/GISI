import type { FastifyError, FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import type { ApplicationLogger } from '../logging/logger.js';

export const apiErrorCodes = [
    'BAD_REQUEST',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'VALIDATION_ERROR',
    'BUSINESS_RULE_VIOLATION',
    'DEPENDENCY_ERROR',
    'PERSISTENCE_ERROR',
    'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof apiErrorCodes)[number];
export type ApiErrorDetail = Record<string, string>;

const statusByCode: Record<ApiErrorCode, number> = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    VALIDATION_ERROR: 422,
    BUSINESS_RULE_VIOLATION: 422,
    DEPENDENCY_ERROR: 500,
    PERSISTENCE_ERROR: 500,
    INTERNAL_ERROR: 500,
};

const messageByCode: Record<ApiErrorCode, string> = {
    BAD_REQUEST: 'Bad request',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Request conflicts with current state',
    VALIDATION_ERROR: 'Invalid request',
    BUSINESS_RULE_VIOLATION: 'Business rule violation',
    DEPENDENCY_ERROR: 'Dependency unavailable',
    PERSISTENCE_ERROR: 'Persistence operation failed',
    INTERNAL_ERROR: 'Internal server error',
};

export class ApiError extends Error {
    readonly code: ApiErrorCode;
    readonly details: readonly ApiErrorDetail[];

    constructor(code: ApiErrorCode, details: readonly ApiErrorDetail[] = []) {
        super(messageByCode[code]);
        this.name = 'ApiError';
        this.code = code;
        this.details = details;
    }
}

export interface ApiErrorResponse {
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly details: readonly ApiErrorDetail[];
    readonly correlationId: string;
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
    return (
        typeof value === 'string' &&
        (apiErrorCodes as readonly string[]).includes(value)
    );
}

function safeDetails(value: unknown): ApiErrorDetail[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((detail) => {
        if (typeof detail !== 'object' || detail === null) {
            return [];
        }

        const candidate = detail as Record<string, unknown>;
        const field =
            typeof candidate.field === 'string' ? candidate.field : undefined;
        const issue =
            typeof candidate.issue === 'string' ? candidate.issue : undefined;
        return field !== undefined && issue !== undefined
            ? [{ field, issue }]
            : [];
    });
}

function validationDetails(error: FastifyError): ApiErrorDetail[] {
    if (!Array.isArray(error.validation)) {
        return [];
    }

    return error.validation.flatMap((entry) => {
        const field =
            typeof entry.instancePath === 'string' &&
            entry.instancePath.length > 0
                ? entry.instancePath
                : typeof entry.params?.missingProperty === 'string'
                  ? entry.params.missingProperty
                  : undefined;
        const issue =
            typeof entry.message === 'string' ? entry.message : undefined;
        return field !== undefined && issue !== undefined
            ? [{ field, issue }]
            : [];
    });
}

function isFastifyError(error: unknown): error is FastifyError {
    return typeof error === 'object' && error !== null;
}

function classifyError(error: unknown): {
    readonly code: ApiErrorCode;
    readonly details: ApiErrorDetail[];
} {
    if (!isFastifyError(error)) {
        return { code: 'INTERNAL_ERROR', details: [] };
    }

    if (isApiErrorCode(error.code)) {
        return {
            code: error.code,
            details: safeDetails(
                error instanceof ApiError ? error.details : [],
            ),
        };
    }

    if (Array.isArray(error.validation)) {
        return { code: 'VALIDATION_ERROR', details: validationDetails(error) };
    }

    switch (error.statusCode) {
        case 400:
            return { code: 'BAD_REQUEST', details: [] };
        case 401:
            return { code: 'UNAUTHORIZED', details: [] };
        case 403:
            return { code: 'FORBIDDEN', details: [] };
        case 404:
            return { code: 'NOT_FOUND', details: [] };
        case 409:
            return { code: 'CONFLICT', details: [] };
        case 422:
            return { code: 'VALIDATION_ERROR', details: [] };
        default:
            return { code: 'INTERNAL_ERROR', details: [] };
    }
}

export function apiErrorBoundaryPlugin(
    logger: ApplicationLogger,
): FastifyPluginAsync {
    return fastifyPlugin(async (fastify) => {
        fastify.setErrorHandler((error, request, reply) => {
            const classified = classifyError(error);
            const correlationId = request.correlationId;
            const requestLogger =
                request.applicationLogger ?? logger.child({ correlationId });

            requestLogger.error(
                {
                    err: error,
                    event: 'api_error',
                    action: 'handle',
                    correlationId,
                    code: classified.code,
                },
                'API request failed',
            );

            const response: ApiErrorResponse = {
                code: classified.code,
                message: messageByCode[classified.code],
                details: classified.details,
                correlationId,
            };

            return reply.status(statusByCode[classified.code]).send(response);
        });
    });
}
