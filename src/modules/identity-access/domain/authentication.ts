import type {
    AccountStatus,
    AuthenticationPrincipal,
    MappedUser,
} from '../contracts/authentication.js';

export function isActiveAccount(user: MappedUser): boolean {
    return user.status === 'ACTIVE';
}

export function authenticationPrincipal(
    user: MappedUser,
): AuthenticationPrincipal {
    return {
        userId: user.id,
        cognitoSubject: user.cognitoSubject,
        actorType: 'user',
    };
}

export function isInactiveAccountStatus(status: AccountStatus): boolean {
    return status === 'DEACTIVATED' || status === 'SUSPENDED';
}
