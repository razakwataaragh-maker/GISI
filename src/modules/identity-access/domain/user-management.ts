import type {
    AccountStatus,
    ManagedUser,
    UserStatusTransition,
} from '../contracts/user-management.js';

export class UserManagementError extends Error {
    constructor(
        message: string,
        readonly code: string,
    ) {
        super(message);
        this.name = 'UserManagementError';
    }
}

export class UserNotFoundError extends UserManagementError {
    constructor(id: string) {
        super(`User ${id} was not found`, 'USER_NOT_FOUND');
        this.name = 'UserNotFoundError';
    }
}

export class DuplicateCognitoSubjectError extends UserManagementError {
    constructor() {
        super(
            'The Cognito subject is already linked to a user',
            'DUPLICATE_COGNITO_SUBJECT',
        );
        this.name = 'DuplicateCognitoSubjectError';
    }
}

export class UnauthorizedUserManagementError extends UserManagementError {
    constructor(action: string) {
        super(`The actor is not authorized to ${action}`, 'UNAUTHORIZED');
        this.name = 'UnauthorizedUserManagementError';
    }
}

export class ImmutableCognitoSubjectError extends UserManagementError {
    constructor() {
        super(
            'cognitoSubject is immutable after provisioning',
            'IMMUTABLE_COGNITO_SUBJECT',
        );
        this.name = 'ImmutableCognitoSubjectError';
    }
}

export class InvalidUserUpdateError extends UserManagementError {
    constructor(field: string) {
        super(
            `User field ${field} is not an approved update field`,
            'INVALID_USER_UPDATE',
        );
        this.name = 'InvalidUserUpdateError';
    }
}

export class InvalidUserSearchError extends UserManagementError {
    constructor() {
        super(
            'Provide exactly one of id or cognitoSubject when searching for a user',
            'INVALID_USER_SEARCH',
        );
        this.name = 'InvalidUserSearchError';
    }
}

export class InvalidUserStatusTransitionError extends UserManagementError {
    constructor(
        readonly transition: UserStatusTransition,
        readonly from: AccountStatus,
    ) {
        super(
            `Cannot ${transition} a user from ${from}`,
            'INVALID_STATUS_TRANSITION',
        );
        this.name = 'InvalidUserStatusTransitionError';
    }
}

export function nextUserStatus(
    current: AccountStatus,
    transition: UserStatusTransition,
): AccountStatus {
    const allowed: Record<UserStatusTransition, AccountStatus> = {
        activate: 'ACTIVE',
        deactivate: 'DEACTIVATED',
        suspend: 'SUSPENDED',
        reactivate: 'ACTIVE',
    };
    const valid =
        (transition === 'activate' && current === 'DEACTIVATED') ||
        (transition === 'deactivate' && current === 'ACTIVE') ||
        (transition === 'suspend' && current === 'ACTIVE') ||
        (transition === 'reactivate' && current === 'SUSPENDED');

    if (!valid) {
        throw new InvalidUserStatusTransitionError(transition, current);
    }
    return allowed[transition];
}

export function lifecycleFields(
    status: AccountStatus,
    at: Date,
): Pick<ManagedUser, 'activatedAt' | 'deactivatedAt' | 'suspendedAt'> {
    return {
        activatedAt: status === 'ACTIVE' ? at : null,
        deactivatedAt: status === 'DEACTIVATED' ? at : null,
        suspendedAt: status === 'SUSPENDED' ? at : null,
    };
}
