import type { UserActor } from './user-management.js';

export type { UserActor };

export type RoleStatus = 'ACTIVE' | 'INACTIVE';
export type RolePermissionStatus = 'ACTIVE' | 'REVOKED';
export type UserRoleAssignmentStatus = 'ACTIVE' | 'REVOKED';

export interface Role {
    readonly id: string;
    readonly key: string;
    readonly name: string;
    readonly description: string | null;
    readonly status: RoleStatus;
    readonly rank: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly createdBy: string;
    readonly updatedBy: string;
    readonly deactivatedAt: Date | null;
    readonly deactivatedBy: string | null;
    readonly deactivationReason: string | null;
    readonly changeReference: string | null;
}

export interface PermissionReference {
    readonly id: string;
}

export interface RolePermission {
    readonly id: string;
    readonly roleId: string;
    readonly permissionId: string;
    readonly status: RolePermissionStatus;
    readonly assignedAt: Date;
    readonly assignedBy: string;
    readonly assignmentReason: string;
    readonly revokedAt: Date | null;
    readonly revokedBy: string | null;
    readonly revocationReason: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly changeReference: string | null;
}

export interface UserRoleAssignment {
    readonly id: string;
    readonly userId: string;
    readonly roleId: string;
    readonly status: UserRoleAssignmentStatus;
    readonly assignedAt: Date;
    readonly assignedBy: string;
    readonly revokedAt: Date | null;
    readonly revokedBy: string | null;
    readonly assignmentReason: string;
    readonly revocationReason: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly changeReference: string | null;
}

export interface CreateRoleInput {
    readonly key: string;
    readonly name: string;
    readonly description?: string;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface ModifyRoleInput {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface DeactivateRoleInput {
    readonly id: string;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface GrantPermissionInput {
    readonly roleId: string;
    readonly permissionId: string;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface RevokePermissionInput {
    readonly roleId: string;
    readonly permissionId: string;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface AssignRoleInput {
    readonly userId: string;
    readonly roleId: string;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface RevokeRoleInput {
    readonly userId: string;
    readonly roleId: string;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface BootstrapAdministratorInput {
    readonly userId: string;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface AssignSystemAdministratorRoleInput {
    readonly userId: string;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export interface AuthorizationInput {
    readonly actor: UserActor;
    readonly action: string;
    readonly resourceType?: string;
    readonly resourceContext?: Record<string, unknown>;
}

export interface AuthorizationResult {
    readonly allowed: boolean;
    readonly reason?: string;
}

export type RolesAndPermissionsAction =
    | 'role.read'
    | 'role.create'
    | 'role.modify'
    | 'role.deactivate'
    | 'role.assign'
    | 'role.revoke'
    | 'permission.grant'
    | 'permission.revoke'
    | 'bootstrap.administrator'
    | 'bootstrap.assign_system_administrator';

export interface RolesAndPermissionsAuthorization {
    authorize(input: {
        readonly actor: UserActor;
        readonly action: RolesAndPermissionsAction;
        readonly targetRoleId?: string;
        readonly targetUserId?: string;
    }): Promise<boolean>;
}

export interface RolesAndPermissionsRepository {
    // Role operations
    findRoleById(id: string): Promise<Role | null>;
    findRoleByKey(key: string): Promise<Role | null>;
    createRole(input: {
        readonly id?: string;
        readonly key: string;
        readonly name: string;
        readonly description: string | null;
        readonly status: RoleStatus;
        readonly rank: number;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly createdBy: string;
        readonly updatedBy: string;
    }): Promise<Role>;
    updateRole(
        id: string,
        fields: {
            readonly name?: string;
            readonly description?: string;
            readonly updatedAt: Date;
            readonly updatedBy: string;
        },
    ): Promise<Role>;
    deactivateRole(
        id: string,
        fields: {
            readonly status: RoleStatus;
            readonly updatedAt: Date;
            readonly deactivatedAt: Date;
            readonly deactivatedBy: string;
            readonly deactivationReason: string;
        },
    ): Promise<Role>;

    // Permission operations
    findPermissionById(id: string): Promise<PermissionReference | null>;
    createPermission(input: {
        readonly id: string;
    }): Promise<PermissionReference>;

    // Bootstrap operations
    findBootstrapControl(): Promise<{
        id: string;
        consumedAt: Date | null;
    } | null>;
    createBootstrapControl(input: {
        readonly id: string;
        readonly createdAt: Date;
        readonly updatedAt: Date;
    }): Promise<BootstrapControl>;
    consumeBootstrapControl(
        id: string,
        fields: {
            readonly consumedAt: Date;
            readonly consumedBy: string;
            readonly changeReference: string;
            readonly updatedAt: Date;
        },
    ): Promise<void>;

    // Role-permission operations
    findActiveRolePermission(
        roleId: string,
        permissionId: string,
    ): Promise<RolePermission | null>;
    createRolePermission(input: {
        readonly id?: string;
        readonly roleId: string;
        readonly permissionId: string;
        readonly status: RolePermissionStatus;
        readonly assignedAt: Date;
        readonly assignedBy: string;
        readonly assignmentReason: string;
        readonly createdAt: Date;
        readonly updatedAt: Date;
    }): Promise<RolePermission>;
    revokeRolePermission(
        id: string,
        fields: {
            readonly status: RolePermissionStatus;
            readonly revokedAt: Date;
            readonly revokedBy: string;
            readonly revocationReason: string;
            readonly updatedAt: Date;
        },
    ): Promise<RolePermission>;
    findActivePermissionsForRole(roleId: string): Promise<RolePermission[]>;

    // User-role operations
    findActiveUserRoleAssignment(
        userId: string,
        roleId: string,
    ): Promise<UserRoleAssignment | null>;
    createUserRoleAssignment(input: {
        readonly id?: string;
        readonly userId: string;
        readonly roleId: string;
        readonly status: UserRoleAssignmentStatus;
        readonly assignedAt: Date;
        readonly assignedBy: string;
        readonly assignmentReason: string;
        readonly createdAt: Date;
        readonly updatedAt: Date;
    }): Promise<UserRoleAssignment>;
    revokeUserRoleAssignment(
        id: string,
        fields: {
            readonly status: UserRoleAssignmentStatus;
            readonly revokedAt: Date;
            readonly revokedBy: string;
            readonly revocationReason: string;
            readonly updatedAt: Date;
        },
    ): Promise<UserRoleAssignment>;
    findActiveRolesForUser(userId: string): Promise<UserRoleAssignment[]>;
}

export interface AuthorizationService {
    authorize(input: AuthorizationInput): Promise<AuthorizationResult>;
}

export interface BootstrapControl {
    readonly id: string;
    readonly consumedAt: Date | null;
    readonly consumedBy: string | null;
    readonly changeReference: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
