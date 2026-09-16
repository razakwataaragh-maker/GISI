/**
 * Domain errors for roles and permissions management
 */

export class RolesAndPermissionsError extends Error {
    constructor(
        message: string,
        readonly code: string,
    ) {
        super(message);
        this.name = 'RolesAndPermissionsError';
    }
}

export class RoleNotFoundError extends RolesAndPermissionsError {
    constructor(id: string) {
        super(`Role ${id} was not found`, 'ROLE_NOT_FOUND');
        this.name = 'RoleNotFoundError';
    }
}

export class DuplicateRoleKeyError extends RolesAndPermissionsError {
    constructor(key: string) {
        super(`Role key ${key} already exists`, 'DUPLICATE_ROLE_KEY');
        this.name = 'DuplicateRoleKeyError';
    }
}

export class PermissionNotFoundError extends RolesAndPermissionsError {
    constructor(id: string) {
        super(
            `Permission ${id} was not found in the registry`,
            'PERMISSION_NOT_FOUND',
        );
        this.name = 'PermissionNotFoundError';
    }
}

export class InvalidRoleStatusError extends RolesAndPermissionsError {
    constructor(currentStatus: string, requestedTransition: string) {
        super(
            `Cannot ${requestedTransition} a role with status ${currentStatus}`,
            'INVALID_ROLE_STATUS',
        );
        this.name = 'InvalidRoleStatusError';
    }
}

export class DuplicateRolePermissionError extends RolesAndPermissionsError {
    constructor(roleId: string, permissionId: string) {
        super(
            `Permission ${permissionId} is already assigned to role ${roleId}`,
            'DUPLICATE_ROLE_PERMISSION',
        );
        this.name = 'DuplicateRolePermissionError';
    }
}

export class RolePermissionNotAssignedError extends RolesAndPermissionsError {
    constructor(roleId: string, permissionId: string) {
        super(
            `Permission ${permissionId} is not assigned to role ${roleId}`,
            'ROLE_PERMISSION_NOT_ASSIGNED',
        );
        this.name = 'RolePermissionNotAssignedError';
    }
}

export class DuplicateUserRoleAssignmentError extends RolesAndPermissionsError {
    constructor(userId: string, roleId: string) {
        super(
            `User ${userId} already has an active assignment to role ${roleId}`,
            'DUPLICATE_USER_ROLE_ASSIGNMENT',
        );
        this.name = 'DuplicateUserRoleAssignmentError';
    }
}

export class UserRoleAssignmentNotActiveError extends RolesAndPermissionsError {
    constructor(userId: string, roleId: string) {
        super(
            `User ${userId} does not have an active assignment to role ${roleId}`,
            'USER_ROLE_ASSIGNMENT_NOT_ACTIVE',
        );
        this.name = 'UserRoleAssignmentNotActiveError';
    }
}

export class PrivilegeEscalationError extends RolesAndPermissionsError {
    constructor(reason: string) {
        super(
            `Privilege escalation blocked: ${reason}`,
            'PRIVILEGE_ESCALATION',
        );
        this.name = 'PrivilegeEscalationError';
    }
}

export class BootstrapAlreadyConsumedError extends RolesAndPermissionsError {
    constructor() {
        super(
            'Bootstrap administrator has already been established',
            'BOOTSTRAP_ALREADY_CONSUMED',
        );
        this.name = 'BootstrapAlreadyConsumedError';
    }
}

export class UnauthorizedRolesAndPermissionsError extends RolesAndPermissionsError {
    constructor(action: string) {
        super(`The actor is not authorized to ${action}`, 'UNAUTHORIZED');
        this.name = 'UnauthorizedRolesAndPermissionsError';
    }
}

/**
 * Role status transitions
 */
export type RoleStatusTransition = 'activate' | 'deactivate';

export function nextRoleStatus(
    current: 'ACTIVE' | 'INACTIVE',
    transition: RoleStatusTransition,
): 'ACTIVE' | 'INACTIVE' {
    const valid =
        (transition === 'activate' && current === 'INACTIVE') ||
        (transition === 'deactivate' && current === 'ACTIVE');

    if (!valid) {
        throw new InvalidRoleStatusError(current, transition);
    }

    return transition === 'activate' ? 'ACTIVE' : 'INACTIVE';
}
