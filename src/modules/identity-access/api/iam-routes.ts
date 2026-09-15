import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import {
    ApiError,
    type ApiErrorCode,
} from '../../../infrastructure/http/api-error-boundary.js';
import { requestCorrelationId } from '../../../infrastructure/http/correlation-id.js';
import type { AuthenticateUser } from '../application/authenticate-user.js';
import type { ManageRolesAndPermissions } from '../application/manage-roles-and-permissions.js';
import type { ManageUsers } from '../application/manage-users.js';
import type {
    AuthenticationContext,
    AuthenticationPrincipal,
} from '../contracts/authentication.js';
import type {
    RolesAndPermissionsAction,
    RolesAndPermissionsAuthorization,
    UserActor,
} from '../contracts/roles-and-permissions.js';
import type {
    UserManagementAction,
    UserStatusTransition,
} from '../contracts/user-management.js';

declare module 'fastify' {
    interface FastifyRequest {
        authenticationContext: AuthenticationContext | null;
    }
}

export interface IamRoutesDependencies {
    readonly authenticateUser: AuthenticateUser;
    readonly manageUsers: ManageUsers;
    readonly manageRolesAndPermissions: ManageRolesAndPermissions;
    readonly authorization: RolesAndPermissionsAuthorization;
}

type ProtectedRequest = FastifyRequest & {
    authenticationContext: AuthenticationContext;
};

interface UserIdParams {
    readonly id: string;
}

interface RoleIdParams {
    readonly id: string;
}

interface RolePermissionParams {
    readonly id: string;
    readonly permissionId: string;
}

interface UserRoleParams {
    readonly userId: string;
    readonly roleId: string;
}

interface UserQuery {
    readonly id?: string;
    readonly cognitoSubject?: string;
}

interface LoginBody {
    readonly accessToken: string;
}

interface ProvisionUserBody {
    readonly cognitoSubject: string;
    readonly reason: string;
    readonly status?: 'ACTIVE' | 'DEACTIVATED';
}

interface UpdateUserBody {
    readonly statusChangeReason?: string;
}

interface StatusBody {
    readonly transition: UserStatusTransition;
    readonly reason: string;
}

interface RoleBody {
    readonly key: string;
    readonly name: string;
    readonly description?: string;
    readonly reason: string;
}

interface ModifyRoleBody {
    readonly name?: string;
    readonly description?: string;
    readonly reason: string;
}

interface ReasonBody {
    readonly reason: string;
}

interface PermissionBody {
    readonly permissionId: string;
    readonly reason: string;
}

function actorFrom(context: AuthenticationContext): UserActor {
    return { id: context.principal.userId, type: 'user' };
}

function principalResponse(principal: AuthenticationPrincipal) {
    return {
        userId: principal.userId,
        cognitoSubject: principal.cognitoSubject,
        actorType: principal.actorType,
    };
}

function bearerToken(request: FastifyRequest): string {
    const header = request.headers.authorization;
    if (typeof header !== 'string') {
        throw new ApiError('UNAUTHORIZED');
    }

    const matches = /^Bearer ([^\s]+)$/.exec(header);
    if (matches?.[1] === undefined) {
        throw new ApiError('UNAUTHORIZED');
    }
    return matches[1];
}

async function authenticateRequest(
    request: FastifyRequest,
    dependencies: IamRoutesDependencies,
): Promise<void> {
    if (request.routeOptions.url === '/auth/login') {
        return;
    }

    const result = await dependencies.authenticateUser.execute({
        token: bearerToken(request),
        correlationId: requestCorrelationId(request),
    });

    if (!result.ok) {
        throw new ApiError(result.failure.code);
    }

    request.authenticationContext = result.context;
}

function protectedRequest(request: FastifyRequest): ProtectedRequest {
    if (request.authenticationContext === null) {
        throw new ApiError('UNAUTHORIZED');
    }
    return request as ProtectedRequest;
}

async function authorize(
    request: ProtectedRequest,
    dependencies: IamRoutesDependencies,
    action: UserManagementAction | RolesAndPermissionsAction,
    targetUserId?: string,
    targetRoleId?: string,
): Promise<void> {
    const allowed = await dependencies.authorization.authorize({
        actor: actorFrom(request.authenticationContext),
        action: action as RolesAndPermissionsAction,
        ...(targetUserId === undefined ? {} : { targetUserId }),
        ...(targetRoleId === undefined ? {} : { targetRoleId }),
    });
    if (!allowed) {
        throw new ApiError('FORBIDDEN');
    }
}

function mapApplicationError(error: unknown): never {
    if (
        typeof error !== 'object' ||
        error === null ||
        !('code' in error) ||
        typeof error.code !== 'string'
    ) {
        throw new ApiError('INTERNAL_ERROR');
    }

    const code = error.code;
    const mapping: Record<string, ApiErrorCode> = {
        UNAUTHORIZED: 'UNAUTHORIZED',
        USER_NOT_FOUND: 'NOT_FOUND',
        ROLE_NOT_FOUND: 'NOT_FOUND',
        PERMISSION_NOT_FOUND: 'NOT_FOUND',
        DUPLICATE_COGNITO_SUBJECT: 'CONFLICT',
        DUPLICATE_ROLE_KEY: 'CONFLICT',
        DUPLICATE_ROLE_PERMISSION: 'CONFLICT',
        DUPLICATE_USER_ROLE_ASSIGNMENT: 'CONFLICT',
        ROLE_PERMISSION_NOT_ASSIGNED: 'CONFLICT',
        USER_ROLE_ASSIGNMENT_NOT_ACTIVE: 'CONFLICT',
        INVALID_USER_SEARCH: 'VALIDATION_ERROR',
        INVALID_USER_UPDATE: 'VALIDATION_ERROR',
        IMMUTABLE_COGNITO_SUBJECT: 'VALIDATION_ERROR',
        INVALID_STATUS_TRANSITION: 'BUSINESS_RULE_VIOLATION',
        INVALID_ROLE_STATUS: 'BUSINESS_RULE_VIOLATION',
        PRIVILEGE_ESCALATION: 'FORBIDDEN',
        BOOTSTRAP_ALREADY_CONSUMED: 'CONFLICT',
    };

    const mapped = mapping[code];
    if (mapped === undefined) {
        throw new ApiError('INTERNAL_ERROR');
    }
    throw new ApiError(mapped);
}

async function execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        return mapApplicationError(error);
    }
}

export const iamRoutesPlugin = (
    dependencies: IamRoutesDependencies,
): FastifyPluginAsync =>
    fastifyPlugin(async (fastify) => {
        fastify.decorateRequest('authenticationContext', null);

        fastify.post<{ Body: LoginBody }>(
            '/auth/login',
            {
                schema: {
                    body: {
                        type: 'object',
                        required: ['accessToken'],
                        additionalProperties: false,
                        properties: {
                            accessToken: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request) => {
                const result = await dependencies.authenticateUser.execute({
                    token: request.body.accessToken,
                    correlationId: requestCorrelationId(request),
                });
                if (!result.ok) {
                    throw new ApiError(result.failure.code);
                }
                return {
                    principal: principalResponse(result.context.principal),
                };
            },
        );

        fastify.addHook('preHandler', async (request) =>
            authenticateRequest(request, dependencies),
        );

        fastify.get('/me', async (request) => {
            const protectedRequestValue = protectedRequest(request);
            await authorize(protectedRequestValue, dependencies, 'user.read');
            const actor = actorFrom(
                protectedRequestValue.authenticationContext,
            );
            const user = await execute(() =>
                dependencies.manageUsers.findById(actor.id, actor),
            );
            if (user === null) {
                throw new ApiError('NOT_FOUND');
            }
            return user;
        });

        fastify.get<{ Querystring: UserQuery }>(
            '/users',
            {
                schema: {
                    querystring: {
                        type: 'object',
                        additionalProperties: false,
                        minProperties: 1,
                        maxProperties: 1,
                        properties: {
                            id: { type: 'string', minLength: 1 },
                            cognitoSubject: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'user.read',
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                const user = await execute(() =>
                    dependencies.manageUsers.find(request.query, actor),
                );
                return user === null ? [] : [user];
            },
        );

        fastify.post<{ Body: ProvisionUserBody }>(
            '/users',
            {
                schema: {
                    body: {
                        type: 'object',
                        required: ['cognitoSubject', 'reason'],
                        additionalProperties: false,
                        properties: {
                            cognitoSubject: { type: 'string', minLength: 1 },
                            reason: { type: 'string', minLength: 1 },
                            status: { enum: ['ACTIVE', 'DEACTIVATED'] },
                        },
                    },
                },
            },
            async (request, reply) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'user.provision',
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                const user = await execute(() =>
                    dependencies.manageUsers.provision({
                        ...request.body,
                        actor,
                        correlationId: requestCorrelationId(request),
                    }),
                );
                return reply.code(201).send(user);
            },
        );

        fastify.patch<{ Params: UserIdParams; Body: UpdateUserBody }>(
            '/users/:id',
            {
                schema: {
                    params: {
                        type: 'object',
                        required: ['id'],
                        properties: { id: { type: 'string', minLength: 1 } },
                    },
                    body: {
                        type: 'object',
                        required: ['statusChangeReason'],
                        additionalProperties: false,
                        properties: {
                            statusChangeReason: {
                                type: 'string',
                                minLength: 1,
                            },
                        },
                    },
                },
            },
            async (request) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'user.update',
                    request.params.id,
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                return execute(() =>
                    dependencies.manageUsers.update({
                        id: request.params.id,
                        actor,
                        fields: request.body,
                        reason: request.body.statusChangeReason ?? 'API update',
                        correlationId: requestCorrelationId(request),
                    }),
                );
            },
        );

        fastify.patch<{ Params: UserIdParams; Body: StatusBody }>(
            '/users/:id/status',
            {
                schema: {
                    params: {
                        type: 'object',
                        required: ['id'],
                        properties: { id: { type: 'string', minLength: 1 } },
                    },
                    body: {
                        type: 'object',
                        required: ['transition', 'reason'],
                        additionalProperties: false,
                        properties: {
                            transition: {
                                enum: [
                                    'activate',
                                    'deactivate',
                                    'suspend',
                                    'reactivate',
                                ],
                            },
                            reason: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request) => {
                const protectedRequestValue = protectedRequest(request);
                const action =
                    `user.${request.body.transition}` as UserManagementAction;
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    action,
                    request.params.id,
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                return execute(() =>
                    dependencies.manageUsers.transition({
                        ...request.body,
                        id: request.params.id,
                        actor,
                        correlationId: requestCorrelationId(request),
                    }),
                );
            },
        );

        fastify.post<{ Body: RoleBody }>(
            '/roles',
            {
                schema: {
                    body: {
                        type: 'object',
                        required: ['key', 'name', 'reason'],
                        additionalProperties: false,
                        properties: {
                            key: { type: 'string', minLength: 1 },
                            name: { type: 'string', minLength: 1 },
                            description: { type: 'string' },
                            reason: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request, reply) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'role.create',
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                const role = await execute(() =>
                    dependencies.manageRolesAndPermissions.createRole({
                        ...request.body,
                        actor,
                        correlationId: requestCorrelationId(request),
                    }),
                );
                return reply.code(201).send(role);
            },
        );

        fastify.patch<{ Params: RoleIdParams; Body: ModifyRoleBody }>(
            '/roles/:id',
            {
                schema: {
                    params: {
                        type: 'object',
                        required: ['id'],
                        properties: { id: { type: 'string', minLength: 1 } },
                    },
                    body: {
                        type: 'object',
                        required: ['reason'],
                        minProperties: 2,
                        additionalProperties: false,
                        properties: {
                            name: { type: 'string', minLength: 1 },
                            description: { type: 'string' },
                            reason: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'role.modify',
                    undefined,
                    request.params.id,
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                return execute(() =>
                    dependencies.manageRolesAndPermissions.modifyRole({
                        ...request.params,
                        ...request.body,
                        actor,
                        correlationId: requestCorrelationId(request),
                    }),
                );
            },
        );

        fastify.patch<{ Params: RoleIdParams; Body: ReasonBody }>(
            '/roles/:id/status',
            {
                schema: {
                    params: {
                        type: 'object',
                        required: ['id'],
                        properties: { id: { type: 'string', minLength: 1 } },
                    },
                    body: {
                        type: 'object',
                        required: ['reason'],
                        additionalProperties: false,
                        properties: {
                            reason: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'role.deactivate',
                    undefined,
                    request.params.id,
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                return execute(() =>
                    dependencies.manageRolesAndPermissions.deactivateRole({
                        ...request.params,
                        ...request.body,
                        actor,
                        correlationId: requestCorrelationId(request),
                    }),
                );
            },
        );

        fastify.post<{ Params: RoleIdParams; Body: PermissionBody }>(
            '/roles/:id/permissions',
            {
                schema: {
                    params: {
                        type: 'object',
                        required: ['id'],
                        properties: { id: { type: 'string', minLength: 1 } },
                    },
                    body: {
                        type: 'object',
                        required: ['permissionId', 'reason'],
                        additionalProperties: false,
                        properties: {
                            permissionId: { type: 'string', minLength: 1 },
                            reason: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request, reply) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'permission.grant',
                    undefined,
                    request.params.id,
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                await execute(() =>
                    dependencies.manageRolesAndPermissions.grantPermission({
                        roleId: request.params.id,
                        ...request.body,
                        actor,
                        correlationId: requestCorrelationId(request),
                    }),
                );
                return reply.code(204).send();
            },
        );

        fastify.delete<{ Params: RolePermissionParams; Body: ReasonBody }>(
            '/roles/:id/permissions/:permissionId',
            {
                schema: {
                    params: {
                        type: 'object',
                        required: ['id', 'permissionId'],
                        properties: {
                            id: { type: 'string', minLength: 1 },
                            permissionId: { type: 'string', minLength: 1 },
                        },
                    },
                    body: {
                        type: 'object',
                        required: ['reason'],
                        additionalProperties: false,
                        properties: {
                            reason: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request, reply) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'permission.revoke',
                    undefined,
                    request.params.id,
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                await execute(() =>
                    dependencies.manageRolesAndPermissions.revokePermission({
                        roleId: request.params.id,
                        permissionId: request.params.permissionId,
                        actor,
                        reason: request.body.reason,
                        correlationId: requestCorrelationId(request),
                    }),
                );
                return reply.code(204).send();
            },
        );

        fastify.post<{ Params: UserRoleParams; Body: ReasonBody }>(
            '/users/:userId/roles/:roleId',
            {
                schema: {
                    params: {
                        type: 'object',
                        required: ['userId', 'roleId'],
                        properties: {
                            userId: { type: 'string', minLength: 1 },
                            roleId: { type: 'string', minLength: 1 },
                        },
                    },
                    body: {
                        type: 'object',
                        required: ['reason'],
                        additionalProperties: false,
                        properties: {
                            reason: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request, reply) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'role.assign',
                    request.params.userId,
                    request.params.roleId,
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                await execute(() =>
                    dependencies.manageRolesAndPermissions.assignRole({
                        ...request.params,
                        ...request.body,
                        actor,
                        correlationId: requestCorrelationId(request),
                    }),
                );
                return reply.code(204).send();
            },
        );

        fastify.delete<{ Params: UserRoleParams; Body: ReasonBody }>(
            '/users/:userId/roles/:roleId',
            {
                schema: {
                    params: {
                        type: 'object',
                        required: ['userId', 'roleId'],
                        properties: {
                            userId: { type: 'string', minLength: 1 },
                            roleId: { type: 'string', minLength: 1 },
                        },
                    },
                    body: {
                        type: 'object',
                        required: ['reason'],
                        additionalProperties: false,
                        properties: {
                            reason: { type: 'string', minLength: 1 },
                        },
                    },
                },
            },
            async (request, reply) => {
                const protectedRequestValue = protectedRequest(request);
                await authorize(
                    protectedRequestValue,
                    dependencies,
                    'role.revoke',
                    request.params.userId,
                    request.params.roleId,
                );
                const actor = actorFrom(
                    protectedRequestValue.authenticationContext,
                );
                await execute(() =>
                    dependencies.manageRolesAndPermissions.revokeRole({
                        ...request.params,
                        ...request.body,
                        actor,
                        correlationId: requestCorrelationId(request),
                    }),
                );
                return reply.code(204).send();
            },
        );
    });
