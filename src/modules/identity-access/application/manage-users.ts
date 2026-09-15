import type {
    AuditEventInput,
    AuditWriter,
} from '../../audit/domain/audit-writer.js';
import type {
    AccountStatus,
    FindUserInput,
    ManagedUser,
    ProvisionUserInput,
    TransitionUserInput,
    UpdateUserInput,
    UserManagementAction,
    UserManagementAuthorization,
    UserManagementRepository,
    UserActor,
} from '../contracts/user-management.js';
import {
    DuplicateCognitoSubjectError,
    ImmutableCognitoSubjectError,
    InvalidUserSearchError,
    InvalidUserStatusTransitionError,
    InvalidUserUpdateError,
    UserNotFoundError,
    UnauthorizedUserManagementError,
    lifecycleFields,
    nextUserStatus,
} from '../domain/user-management.js';

export interface ManageUsersDependencies {
    readonly userRepository: UserManagementRepository;
    readonly auditWriter: AuditWriter;
    readonly authorization: UserManagementAuthorization;
    readonly clock?: () => Date;
}

export class ManageUsers {
    private readonly clock: () => Date;

    constructor(private readonly dependencies: ManageUsersDependencies) {
        this.clock = dependencies.clock ?? (() => new Date());
    }

    async provision(input: ProvisionUserInput): Promise<ManagedUser> {
        try {
            await this.assertAuthorized(input.actor, 'user.provision');
        } catch (error) {
            if (error instanceof UnauthorizedUserManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'user',
                    action: 'provision',
                    outcome: 'failure',
                    reason: 'authorization_denied',
                    ...correlation(input.correlationId),
                });
            }
            throw error;
        }

        const existing =
            await this.dependencies.userRepository.findByCognitoSubject(
                input.cognitoSubject,
            );
        if (existing !== null) {
            await this.writeAudit({
                eventName: 'user_provision_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'user',
                action: 'provision',
                outcome: 'failure',
                reason: 'duplicate_cognito_subject',
                ...correlation(input.correlationId),
            });
            throw new DuplicateCognitoSubjectError();
        }

        const now = this.clock();
        const status = input.status ?? 'DEACTIVATED';
        const user = await this.dependencies.userRepository.create({
            cognitoSubject: input.cognitoSubject,
            status,
            createdAt: now,
            updatedAt: now,
            ...lifecycleFields(status, now),
            statusChangedAt: now,
            statusChangedBy: input.actor.id,
            statusChangeReason: input.reason,
        });
        await this.writeAudit({
            eventName: 'user_provisioned',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'user',
            targetId: user.id,
            action: 'provision',
            outcome: 'success',
            reason: input.reason,
            afterState: { status: user.status },
            ...correlation(input.correlationId),
        });
        return user;
    }

    async find(
        input: FindUserInput,
        actor: UserActor,
    ): Promise<ManagedUser | null> {
        const hasId = input.id !== undefined;
        const hasSubject = input.cognitoSubject !== undefined;
        if (hasId === hasSubject) {
            throw new InvalidUserSearchError();
        }
        if (input.id !== undefined) {
            return this.findById(input.id, actor);
        }
        if (input.cognitoSubject === undefined) {
            throw new InvalidUserSearchError();
        }
        return this.findByCognitoSubject(input.cognitoSubject, actor);
    }

    async findById(id: string, actor: UserActor): Promise<ManagedUser | null> {
        try {
            await this.assertAuthorized(actor, 'user.read', id);
        } catch (error) {
            if (error instanceof UnauthorizedUserManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'user',
                    targetId: id,
                    action: 'read',
                    outcome: 'failure',
                    reason: 'authorization_denied',
                });
            }
            throw error;
        }
        return this.dependencies.userRepository.findById(id);
    }

    async findByCognitoSubject(
        cognitoSubject: string,
        actor: UserActor,
    ): Promise<ManagedUser | null> {
        try {
            await this.assertAuthorized(actor, 'user.read');
        } catch (error) {
            if (error instanceof UnauthorizedUserManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'user',
                    action: 'read',
                    outcome: 'failure',
                    reason: 'authorization_denied',
                });
            }
            throw error;
        }
        return this.dependencies.userRepository.findByCognitoSubject(
            cognitoSubject,
        );
    }

    async update(input: UpdateUserInput): Promise<ManagedUser> {
        try {
            await this.assertAuthorized(input.actor, 'user.update', input.id);
        } catch (error) {
            if (error instanceof UnauthorizedUserManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'user',
                    targetId: input.id,
                    action: 'update',
                    outcome: 'failure',
                    reason: 'authorization_denied',
                    ...correlation(input.correlationId),
                });
            }
            throw error;
        }

        if (input.fields.cognitoSubject !== undefined) {
            await this.writeAudit({
                eventName: 'user_update_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'user',
                targetId: input.id,
                action: 'update',
                outcome: 'failure',
                reason: 'immutable_cognito_subject',
                ...correlation(input.correlationId),
            });
            throw new ImmutableCognitoSubjectError();
        }

        for (const field of Object.keys(input.fields)) {
            if (field !== 'statusChangeReason') {
                await this.writeAudit({
                    eventName: 'user_update_failed',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'user',
                    targetId: input.id,
                    action: 'update',
                    outcome: 'failure',
                    reason: 'invalid_user_update_field',
                    ...correlation(input.correlationId),
                });
                throw new InvalidUserUpdateError(field);
            }
        }

        const current = await this.dependencies.userRepository.findById(
            input.id,
        );
        if (current === null) {
            await this.writeAudit({
                eventName: 'user_not_found',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'user',
                targetId: input.id,
                action: 'update',
                outcome: 'failure',
                reason: 'user_not_found',
                ...correlation(input.correlationId),
            });
            throw new UserNotFoundError(input.id);
        }
        const user =
            await this.dependencies.userRepository.updateApprovedFields(
                current.id,
                input.fields.statusChangeReason === undefined
                    ? {}
                    : { statusChangeReason: input.fields.statusChangeReason },
                this.clock(),
            );
        await this.writeAudit({
            eventName: 'user_updated',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'user',
            targetId: user.id,
            action: 'update',
            outcome: 'success',
            reason: input.reason,
            beforeState: { status: current.status },
            afterState: { status: user.status },
            ...correlation(input.correlationId),
        });
        return user;
    }

    async transition(input: TransitionUserInput): Promise<ManagedUser> {
        const action = `user.${input.transition}` as UserManagementAction;
        try {
            await this.assertAuthorized(input.actor, action, input.id);
        } catch (error) {
            if (error instanceof UnauthorizedUserManagementError) {
                await this.writeAudit({
                    eventName: 'authorization_denied',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'user',
                    targetId: input.id,
                    action: input.transition,
                    outcome: 'failure',
                    reason: 'authorization_denied',
                    ...correlation(input.correlationId),
                });
            }
            throw error;
        }

        const current = await this.dependencies.userRepository.findById(
            input.id,
        );
        if (current === null) {
            await this.writeAudit({
                eventName: 'user_not_found',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'user',
                targetId: input.id,
                action: input.transition,
                outcome: 'failure',
                reason: 'user_not_found',
                ...correlation(input.correlationId),
            });
            throw new UserNotFoundError(input.id);
        }

        let status: AccountStatus;
        try {
            status = nextUserStatus(current.status, input.transition);
        } catch (error) {
            if (error instanceof InvalidUserStatusTransitionError) {
                await this.writeAudit({
                    eventName: 'user_transition_failed',
                    actorId: input.actor.id,
                    actorType: input.actor.type,
                    targetType: 'user',
                    targetId: input.id,
                    action: input.transition,
                    outcome: 'failure',
                    reason: 'invalid_status_transition',
                    beforeState: { status: current.status },
                    ...correlation(input.correlationId),
                });
            }
            throw error;
        }

        const now = this.clock();
        const user = await this.dependencies.userRepository.update(input.id, {
            status,
            updatedAt: now,
            ...lifecycleFields(status, now),
            statusChangedAt: now,
            statusChangedBy: input.actor.id,
            statusChangeReason: input.reason,
        });
        await this.writeAudit({
            eventName: transitionEventName(input.transition),
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'user',
            targetId: user.id,
            action: input.transition,
            outcome: 'success',
            reason: input.reason,
            beforeState: { status: current.status },
            afterState: { status: user.status },
            ...correlation(input.correlationId),
        });
        return user;
    }

    activate(
        input: Omit<TransitionUserInput, 'transition'>,
    ): Promise<ManagedUser> {
        return this.transition({ ...input, transition: 'activate' });
    }

    deactivate(
        input: Omit<TransitionUserInput, 'transition'>,
    ): Promise<ManagedUser> {
        return this.transition({ ...input, transition: 'deactivate' });
    }

    suspend(
        input: Omit<TransitionUserInput, 'transition'>,
    ): Promise<ManagedUser> {
        return this.transition({ ...input, transition: 'suspend' });
    }

    reactivate(
        input: Omit<TransitionUserInput, 'transition'>,
    ): Promise<ManagedUser> {
        return this.transition({ ...input, transition: 'reactivate' });
    }

    private async assertAuthorized(
        actor: UserActor,
        action: UserManagementAction,
        targetUserId?: string,
    ): Promise<void> {
        const allowed = await this.dependencies.authorization.authorize({
            actor,
            action,
            ...(targetUserId === undefined ? {} : { targetUserId }),
        });
        if (!allowed) {
            throw new UnauthorizedUserManagementError(action);
        }
    }

    private async writeAudit(
        event: Omit<
            AuditEventInput,
            'category' | 'owningModule' | 'sourceBoundary'
        >,
    ): Promise<void> {
        await this.dependencies.auditWriter.append({
            ...event,
            category: 'security',
            owningModule: 'identity-access',
            sourceBoundary: 'application',
        });
    }
}

export { ManageUsers as UserManagementService };

function correlation(correlationId: string | undefined): {
    readonly correlationId?: string;
} {
    return correlationId === undefined ? {} : { correlationId };
}

function transitionEventName(
    transition: TransitionUserInput['transition'],
):
    | 'user_activated'
    | 'user_deactivated'
    | 'user_suspended'
    | 'user_reactivated' {
    const names: Record<
        TransitionUserInput['transition'],
        | 'user_activated'
        | 'user_deactivated'
        | 'user_suspended'
        | 'user_reactivated'
    > = {
        activate: 'user_activated',
        deactivate: 'user_deactivated',
        suspend: 'user_suspended',
        reactivate: 'user_reactivated',
    };
    return names[transition];
}
