import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiErrorBoundaryPlugin } from '../../src/infrastructure/http/api-error-boundary.js';
import { correlationIdPlugin } from '../../src/infrastructure/http/correlation-id.js';
import { iamRoutesPlugin } from '../../src/modules/identity-access/api/iam-routes.js';
import type { IamRoutesDependencies } from '../../src/modules/identity-access/api/iam-routes.js';
import { createLogger } from '../../src/infrastructure/logging/logger.js';

const principal = {
    userId: 'user-1',
    cognitoSubject: 'cognito-1',
    actorType: 'user' as const,
};

const user = {
    id: 'user-1',
    cognitoSubject: 'cognito-1',
    status: 'ACTIVE' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    activatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deactivatedAt: null,
    suspendedAt: null,
    statusChangedAt: new Date('2026-01-01T00:00:00.000Z'),
    statusChangedBy: 'system',
    statusChangeReason: 'provisioned',
};

function dependencies(
    authorized = true,
): IamRoutesDependencies {
    return {
        authenticateUser: {
            execute: vi.fn().mockResolvedValue({
                ok: true,
                context: {
                    principal,
                    assurance: 'cognito-verified',
                    authenticatedAt: new Date('2026-01-01T00:00:00.000Z'),
                },
            }),
        } as never,
        manageUsers: {
            find: vi.fn().mockResolvedValue(user),
            findById: vi.fn().mockResolvedValue(user),
            provision: vi.fn().mockResolvedValue(user),
            update: vi.fn().mockResolvedValue(user),
            transition: vi.fn().mockResolvedValue(user),
        } as never,
        manageRolesAndPermissions: {
            createRole: vi.fn().mockResolvedValue({ id: 'role-1' }),
            modifyRole: vi.fn().mockResolvedValue({ id: 'role-1' }),
            deactivateRole: vi.fn().mockResolvedValue({ id: 'role-1' }),
            grantPermission: vi.fn().mockResolvedValue(undefined),
            revokePermission: vi.fn().mockResolvedValue(undefined),
            assignRole: vi.fn().mockResolvedValue(undefined),
            revokeRole: vi.fn().mockResolvedValue(undefined),
        } as never,
        authorization: {
            authorize: vi.fn().mockResolvedValue(authorized),
        },
    };
}

async function application(routeDependencies: IamRoutesDependencies): Promise<FastifyInstance> {
    const app = Fastify();
    const logger = createLogger({
        level: 'error',
        name: 'gisi',
        version: '1.0.0',
        environment: 'test',
    });
    await app.register(correlationIdPlugin(logger));
    await app.register(apiErrorBoundaryPlugin(logger));
    await app.register(iamRoutesPlugin(routeDependencies));
    return app;
}

let app: FastifyInstance | undefined;

afterEach(async () => {
    await app?.close();
    app = undefined;
});

describe('IAM API routes', () => {
    it('returns the authenticated principal from POST /auth/login', async () => {
        app = await application(dependencies());

        const response = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { accessToken: 'cognito-id-token' },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ principal });
    });

    it('returns UNAUTHORIZED when POST /auth/login authentication fails', async () => {
        const routeDependencies = dependencies();
        routeDependencies.authenticateUser.execute = vi.fn().mockResolvedValue({
            ok: false,
            failure: { code: 'UNAUTHORIZED', reason: 'EXPIRED_TOKEN' },
        });
        app = await application(routeDependencies);

        const response = await app.inject({
            method: 'POST',
            url: '/auth/login',
            payload: { accessToken: 'expired-token' },
        });

        expect(response.statusCode).toBe(401);
        expect(response.json()).toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('returns the authenticated user from GET /me', async () => {
        const routeDependencies = dependencies();
        app = await application(routeDependencies);

        const response = await app.inject({
            method: 'GET',
            url: '/me',
            headers: {
                authorization: 'Bearer verified-token',
                'x-correlation-id': 'iam-request-1',
            },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            ...user,
            activatedAt: user.activatedAt?.toISOString(),
            createdAt: user.createdAt.toISOString(),
            statusChangedAt: user.statusChangedAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        });
        expect(response.headers['x-correlation-id']).toBe('iam-request-1');
        expect(
            vi.mocked(routeDependencies.authorization.authorize),
        ).toHaveBeenCalledWith(
            {
                actor: { id: 'user-1', type: 'user' },
                action: 'user.read',
            },
        );
    });

    it('returns UNAUTHORIZED when the bearer token is missing', async () => {
        app = await application(dependencies());

        const response = await app.inject({
            method: 'GET',
            url: '/me',
            headers: { 'x-correlation-id': 'iam-request-2' },
        });

        expect(response.statusCode).toBe(401);
        expect(response.json()).toEqual({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            details: [],
            correlationId: 'iam-request-2',
        });
    });

    it('returns UNAUTHORIZED when authentication fails', async () => {
        const routeDependencies = dependencies();
        routeDependencies.authenticateUser.execute = vi.fn().mockResolvedValue({
            ok: false,
            failure: { code: 'UNAUTHORIZED', reason: 'EXPIRED_TOKEN' },
        });
        app = await application(routeDependencies);

        const response = await app.inject({
            method: 'GET',
            url: '/me',
            headers: { authorization: 'Bearer expired-token' },
        });

        expect(response.statusCode).toBe(401);
        expect(response.json()).toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            details: [],
        });
    });

    it('returns FORBIDDEN when the actor lacks permission', async () => {
        const routeDependencies = dependencies(false);
        app = await application(routeDependencies);

        const response = await app.inject({
            method: 'GET',
            url: '/me',
            headers: { authorization: 'Bearer verified-token' },
        });

        expect(response.statusCode).toBe(403);
        expect(response.json()).toMatchObject({
            code: 'FORBIDDEN',
            message: 'Access denied',
            details: [],
        });
        expect(routeDependencies.manageUsers.findById).not.toHaveBeenCalled();
    });

    it('returns VALIDATION_ERROR with field details for invalid user input', async () => {
        app = await application(dependencies());

        const response = await app.inject({
            method: 'POST',
            url: '/users',
            headers: { authorization: 'Bearer verified-token' },
            payload: { reason: '' },
        });

        expect(response.statusCode).toBe(422);
        const body = response.json<{
            code: string;
            message: string;
            details: unknown;
            correlationId: string;
        }>();
        expect(body).toMatchObject({
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
        });
        expect(body.correlationId).toEqual(expect.any(String));
        expect(body.details).toEqual(
            expect.arrayContaining([
                {
                    field: 'cognitoSubject',
                    issue: "must have required property 'cognitoSubject'",
                },
            ]),
        );
    });

    it('updates a user with PATCH /users/:id', async () => {
        const routeDependencies = dependencies();
        app = await application(routeDependencies);

        const response = await app.inject({
            method: 'PATCH',
            url: '/users/user-1',
            headers: { authorization: 'Bearer test-token' },
            payload: { statusChangeReason: 'Corrected profile data' },
        });

        expect(response.statusCode).toBe(200);
        expect(routeDependencies.manageUsers.update).toHaveBeenCalledWith(
            expect.objectContaining({
            id: 'user-1',
            actor: { id: 'user-1', type: 'user' },
            fields: { statusChangeReason: 'Corrected profile data' },
            reason: 'Corrected profile data',
            }),
        );
    });

    it('transitions a user with PATCH /users/:id/status', async () => {
        const routeDependencies = dependencies();
        app = await application(routeDependencies);

        const response = await app.inject({
            method: 'PATCH',
            url: '/users/user-1/status',
            headers: { authorization: 'Bearer test-token' },
            payload: { transition: 'activate', reason: 'Approved for access' },
        });

        expect(response.statusCode).toBe(200);
        expect(routeDependencies.manageUsers.transition).toHaveBeenCalledWith(
            expect.objectContaining({
            id: 'user-1',
            transition: 'activate',
            reason: 'Approved for access',
            actor: { id: 'user-1', type: 'user' },
            }),
        );
    });

    it.each([
        {
            name: 'GET /users',
            method: 'GET' as const,
            url: '/users?id=user-1',
            operation: 'find' as const,
            payload: undefined,
        },
        {
            name: 'POST /users',
            method: 'POST' as const,
            url: '/users',
            operation: 'provision' as const,
            payload: {
                cognitoSubject: 'cognito-2',
                reason: 'Provision account',
            },
        },
        {
            name: 'PATCH /users/:id',
            method: 'PATCH' as const,
            url: '/users/user-1',
            operation: 'update' as const,
            payload: { statusChangeReason: 'Correct profile data' },
        },
        {
            name: 'PATCH /users/:id/status',
            method: 'PATCH' as const,
            url: '/users/user-1/status',
            operation: 'transition' as const,
            payload: { transition: 'activate', reason: 'Approve access' },
        },
    ])('allows $name', async ({ method, url, operation, payload }) => {
        const routeDependencies = dependencies();
        app = await application(routeDependencies);

        const response = await app.inject({
            method,
            url,
            headers: { authorization: 'Bearer test-token' },
            ...(payload === undefined ? {} : { payload }),
        });

        expect(response.statusCode).toBe(method === 'POST' ? 201 : 200);
        expect(routeDependencies.manageUsers[operation]).toHaveBeenCalled();
    });

    it.each([
        {
            name: 'GET /users',
            method: 'GET' as const,
            url: '/users?id=user-1',
            payload: undefined,
        },
        {
            name: 'POST /users',
            method: 'POST' as const,
            url: '/users',
            payload: {
                cognitoSubject: 'cognito-2',
                reason: 'Provision account',
            },
        },
        {
            name: 'PATCH /users/:id',
            method: 'PATCH' as const,
            url: '/users/user-1',
            payload: { statusChangeReason: 'Correct profile data' },
        },
        {
            name: 'PATCH /users/:id/status',
            method: 'PATCH' as const,
            url: '/users/user-1/status',
            payload: { transition: 'activate', reason: 'Approve access' },
        },
    ])('denies unauthorized $name', async ({ method, url, payload }) => {
        const routeDependencies = dependencies(false);
        app = await application(routeDependencies);

        const response = await app.inject({
            method,
            url,
            headers: { authorization: 'Bearer test-token' },
            ...(payload === undefined ? {} : { payload }),
        });

        expect(response.statusCode).toBe(403);
        expect(response.json()).toMatchObject({ code: 'FORBIDDEN' });
    });

    it.each([
        {
            name: 'POST /roles',
            method: 'POST' as const,
            url: '/roles',
            payload: { key: 'academic-officer', name: 'Academic Officer', reason: 'Create role' },
            operation: 'createRole' as const,
        },
        {
            name: 'PATCH /roles/:id',
            method: 'PATCH' as const,
            url: '/roles/role-1',
            payload: { name: 'Senior Academic Officer', reason: 'Rename role' },
            operation: 'modifyRole' as const,
        },
        {
            name: 'PATCH /roles/:id/status',
            method: 'PATCH' as const,
            url: '/roles/role-1/status',
            payload: { reason: 'Retire role' },
            operation: 'deactivateRole' as const,
        },
    ])('allows $name', async ({ method, url, payload, operation }) => {
        const routeDependencies = dependencies();
        app = await application(routeDependencies);

        const response = await app.inject({
            method,
            url,
            headers: { authorization: 'Bearer test-token' },
            payload,
        });

        expect(response.statusCode).toBe(method === 'POST' ? 201 : 200);
        expect(routeDependencies.manageRolesAndPermissions[operation]).toHaveBeenCalled();
    });

    it.each([
        {
            name: 'POST /roles',
            method: 'POST' as const,
            url: '/roles',
            payload: { key: 'academic-officer', name: 'Academic Officer', reason: 'Create role' },
        },
        {
            name: 'PATCH /roles/:id',
            method: 'PATCH' as const,
            url: '/roles/role-1',
            payload: { name: 'Senior Academic Officer', reason: 'Rename role' },
        },
        {
            name: 'PATCH /roles/:id/status',
            method: 'PATCH' as const,
            url: '/roles/role-1/status',
            payload: { reason: 'Retire role' },
        },
    ])('denies unauthorized $name', async ({ method, url, payload }) => {
        const routeDependencies = dependencies(false);
        app = await application(routeDependencies);

        const response = await app.inject({
            method,
            url,
            headers: { authorization: 'Bearer test-token' },
            payload,
        });

        expect(response.statusCode).toBe(403);
        expect(response.json()).toMatchObject({ code: 'FORBIDDEN' });
    });

    it.each([
        {
            name: 'POST /roles/:id/permissions',
            method: 'POST' as const,
            url: '/roles/role-1/permissions',
            payload: { permissionId: 'user.read', reason: 'Grant access' },
            operation: 'grantPermission' as const,
        },
        {
            name: 'DELETE /roles/:id/permissions/:permissionId',
            method: 'DELETE' as const,
            url: '/roles/role-1/permissions/user.read',
            payload: { reason: 'Revoke access' },
            operation: 'revokePermission' as const,
        },
        {
            name: 'POST /users/:userId/roles/:roleId',
            method: 'POST' as const,
            url: '/users/user-1/roles/role-1',
            payload: { reason: 'Assign role' },
            operation: 'assignRole' as const,
        },
        {
            name: 'DELETE /users/:userId/roles/:roleId',
            method: 'DELETE' as const,
            url: '/users/user-1/roles/role-1',
            payload: { reason: 'Revoke role' },
            operation: 'revokeRole' as const,
        },
    ])('allows $name', async ({ method, url, payload, operation }) => {
        const routeDependencies = dependencies();
        app = await application(routeDependencies);

        const response = await app.inject({
            method,
            url,
            headers: { authorization: 'Bearer test-token' },
            payload,
        });

        expect(response.statusCode).toBe(204);
        expect(routeDependencies.manageRolesAndPermissions[operation]).toHaveBeenCalled();
    });

    it.each([
        {
            name: 'POST /roles/:id/permissions',
            method: 'POST' as const,
            url: '/roles/role-1/permissions',
            payload: { permissionId: 'user.read', reason: 'Grant access' },
        },
        {
            name: 'DELETE /roles/:id/permissions/:permissionId',
            method: 'DELETE' as const,
            url: '/roles/role-1/permissions/user.read',
            payload: { reason: 'Revoke access' },
        },
        {
            name: 'POST /users/:userId/roles/:roleId',
            method: 'POST' as const,
            url: '/users/user-1/roles/role-1',
            payload: { reason: 'Assign role' },
        },
        {
            name: 'DELETE /users/:userId/roles/:roleId',
            method: 'DELETE' as const,
            url: '/users/user-1/roles/role-1',
            payload: { reason: 'Revoke role' },
        },
    ])('denies unauthorized $name', async ({ method, url, payload }) => {
        const routeDependencies = dependencies(false);
        app = await application(routeDependencies);

        const response = await app.inject({
            method,
            url,
            headers: { authorization: 'Bearer test-token' },
            payload,
        });

        expect(response.statusCode).toBe(403);
        expect(response.json()).toMatchObject({ code: 'FORBIDDEN' });
    });

    it.each([
        {
            name: 'DELETE /roles/:id/permissions/:permissionId',
            url: '/roles/role-1/permissions/user.read',
        },
        {
            name: 'POST /users/:userId/roles/:roleId',
            url: '/users/user-1/roles/role-1',
        },
        {
            name: 'DELETE /users/:userId/roles/:roleId',
            url: '/users/user-1/roles/role-1',
        },
    ])('rejects a missing reason for $name', async ({ url }) => {
        app = await application(dependencies());

        const response = await app.inject({
            method: 'DELETE',
            url,
            headers: { authorization: 'Bearer test-token' },
        });

        expect(response.statusCode).toBe(422);
        expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    });
});
