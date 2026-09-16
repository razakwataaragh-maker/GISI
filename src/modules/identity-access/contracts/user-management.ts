import type {
    UserIdentityRepository,
    AccountStatus,
} from './authentication.js';
export type { AccountStatus } from './authentication.js';

export type UserActorType = 'user' | 'system' | 'service';

export interface UserActor {
    readonly id: string;
    readonly type: UserActorType;
}

export interface ManagedUser {
    readonly id: string;
    readonly cognitoSubject: string;
    readonly status: AccountStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly activatedAt: Date | null;
    readonly deactivatedAt: Date | null;
    readonly suspendedAt: Date | null;
    readonly statusChangedAt: Date;
    readonly statusChangedBy: string;
    readonly statusChangeReason: string;
}

export interface ProvisionUserInput {
    readonly cognitoSubject: string;
    readonly actor: UserActor;
    readonly reason: string;
    /** Explicit provisioning may establish an active account when approved. */
    readonly status?: 'ACTIVE' | 'DEACTIVATED';
    readonly correlationId?: string;
}

export interface FindUserInput {
    readonly id?: string;
    readonly cognitoSubject?: string;
}

export interface UpdateUserFields {
    /**
     * The only currently approved mutable User field. Status and lifecycle
     * metadata are changed only by the explicit transition operations.
     */
    readonly statusChangeReason?: string;
    readonly cognitoSubject?: string;
}

export interface UpdateUserInput {
    readonly id: string;
    readonly actor: UserActor;
    readonly fields: UpdateUserFields;
    readonly reason: string;
    readonly correlationId?: string;
}

export type UserStatusTransition =
    'activate' | 'deactivate' | 'suspend' | 'reactivate';

export interface TransitionUserInput {
    readonly id: string;
    readonly transition: UserStatusTransition;
    readonly actor: UserActor;
    readonly reason: string;
    readonly correlationId?: string;
}

export type UserManagementAction =
    | 'user.read'
    | 'user.provision'
    | 'user.update'
    | 'user.activate'
    | 'user.deactivate'
    | 'user.suspend'
    | 'user.reactivate';

export interface UserManagementAuthorization {
    authorize(input: {
        readonly actor: UserActor;
        readonly action: UserManagementAction;
        readonly targetUserId?: string;
    }): Promise<boolean>;
}

export interface UserManagementRepository extends UserIdentityRepository {
    findById(id: string): Promise<ManagedUser | null>;
    findByCognitoSubject(subject: string): Promise<ManagedUser | null>;
    create(input: {
        readonly id?: string;
        readonly cognitoSubject: string;
        readonly status: AccountStatus;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly activatedAt: Date | null;
        readonly deactivatedAt: Date | null;
        readonly suspendedAt: Date | null;
        readonly statusChangedAt: Date;
        readonly statusChangedBy: string;
        readonly statusChangeReason: string;
    }): Promise<ManagedUser>;
    update(
        id: string,
        fields: {
            readonly status: AccountStatus;
            readonly updatedAt: Date;
            readonly activatedAt: Date | null;
            readonly deactivatedAt: Date | null;
            readonly suspendedAt: Date | null;
            readonly statusChangedAt: Date;
            readonly statusChangedBy: string;
            readonly statusChangeReason: string;
        },
    ): Promise<ManagedUser>;
    updateApprovedFields(
        id: string,
        fields: { readonly statusChangeReason?: string },
        updatedAt: Date,
    ): Promise<ManagedUser>;
}
