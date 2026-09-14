/**
 * Permission Registry for GISI
 *
 * This is the code-level permission registry as defined in iam-data-model.md.
 * Permissions are declared by owning modules and are stable identifiers that
 * evolve with the module that owns the protected resource.
 *
 * Permissions follow the pattern: {module}.{action}
 * where action describes the operation on the resource type.
 */

export interface Permission {
    readonly id: string;
    readonly owningModule: string;
    readonly action: string;
    readonly resourceType: string;
    readonly description: string;
}

/**
 * Identity & Access Management Module Permissions
 * These permissions control IAM operations themselves.
 */
export const IDENTITY_ACCESS_PERMISSIONS: readonly Permission[] = [
    {
        id: 'identity-access.user.read',
        owningModule: 'identity-access',
        action: 'read',
        resourceType: 'user',
        description: 'Read user information',
    },
    {
        id: 'identity-access.user.provision',
        owningModule: 'identity-access',
        action: 'provision',
        resourceType: 'user',
        description: 'Provision a new user account',
    },
    {
        id: 'identity-access.user.update',
        owningModule: 'identity-access',
        action: 'update',
        resourceType: 'user',
        description: 'Update user information',
    },
    {
        id: 'identity-access.user.activate',
        owningModule: 'identity-access',
        action: 'activate',
        resourceType: 'user',
        description: 'Activate a user account',
    },
    {
        id: 'identity-access.user.deactivate',
        owningModule: 'identity-access',
        action: 'deactivate',
        resourceType: 'user',
        description: 'Deactivate a user account',
    },
    {
        id: 'identity-access.user.suspend',
        owningModule: 'identity-access',
        action: 'suspend',
        resourceType: 'user',
        description: 'Suspend a user account',
    },
    {
        id: 'identity-access.user.reactivate',
        owningModule: 'identity-access',
        action: 'reactivate',
        resourceType: 'user',
        description: 'Reactivate a suspended user account',
    },
    {
        id: 'identity-access.role.read',
        owningModule: 'identity-access',
        action: 'read',
        resourceType: 'role',
        description: 'Read role information',
    },
    {
        id: 'identity-access.role.create',
        owningModule: 'identity-access',
        action: 'create',
        resourceType: 'role',
        description: 'Create a new role',
    },
    {
        id: 'identity-access.role.modify',
        owningModule: 'identity-access',
        action: 'modify',
        resourceType: 'role',
        description: 'Modify role definition',
    },
    {
        id: 'identity-access.role.deactivate',
        owningModule: 'identity-access',
        action: 'deactivate',
        resourceType: 'role',
        description: 'Deactivate a role',
    },
    {
        id: 'identity-access.role.assign',
        owningModule: 'identity-access',
        action: 'assign',
        resourceType: 'role',
        description: 'Assign a role to a user',
    },
    {
        id: 'identity-access.role.revoke',
        owningModule: 'identity-access',
        action: 'revoke',
        resourceType: 'role',
        description: 'Revoke a role from a user',
    },
    {
        id: 'identity-access.permission.grant',
        owningModule: 'identity-access',
        action: 'grant',
        resourceType: 'permission',
        description: 'Grant a permission to a role',
    },
    {
        id: 'identity-access.permission.revoke',
        owningModule: 'identity-access',
        action: 'revoke',
        resourceType: 'permission',
        description: 'Revoke a permission from a role',
    },
    {
        id: 'identity-access.bootstrap.administrator',
        owningModule: 'identity-access',
        action: 'bootstrap',
        resourceType: 'administrator',
        description: 'Bootstrap the initial system administrator',
    },
    {
        id: 'identity-access.bootstrap.assign_system_administrator',
        owningModule: 'identity-access',
        action: 'assign_system_administrator',
        resourceType: 'role',
        description: 'Assign the system-administrator role (bootstrap only)',
    },
] as const;

/**
 * Get a permission by its ID
 */
export function getPermission(id: string): Permission | undefined {
    return IDENTITY_ACCESS_PERMISSIONS.find((p) => p.id === id);
}

/**
 * Get all permissions for a module
 */
export function getPermissionsByModule(
    owningModule: string,
): readonly Permission[] {
    return IDENTITY_ACCESS_PERMISSIONS.filter(
        (p) => p.owningModule === owningModule,
    );
}

/**
 * Validate that a permission ID exists in the registry
 */
export function validatePermissionId(id: string): boolean {
    return getPermission(id) !== undefined;
}
