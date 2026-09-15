import { describe, expect, it } from 'vitest';
import type {
    AuditEvent,
    AuditEventInput,
} from '../../src/modules/audit/domain/audit-writer.js';
import { ManageUsers } from '../../src/modules/identity-access/application/manage-users.js';
import type {
    ManagedUser,
    UserManagementRepository,
} from '../../src/modules/identity-access/contracts/user-management.js';
import {
    DuplicateCognitoSubjectError,
    ImmutableCognitoSubjectError,
    InvalidUserStatusTransitionError,
    InvalidUserUpdateError,
    UnauthorizedUserManagementError,
    UserNotFoundError,
} from '../../src/modules/identity-access/domain/user-management.js';

const actor = { id: 'admin-1', type: 'user' as const };
const firstTime = new Date('2026-09-13T10:00:00.000Z');

function expectSafeAuditEvent(
    event: AuditEventInput | undefined,
    expected: Partial<AuditEventInput>,
): void {
    expect(event).toMatchObject({
        category: 'security',
        owningModule: 'identity-access',
        sourceBoundary: 'application',
        ...expected,
    });
    expect(Object.keys(event ?? {})).not.toEqual(
        expect.arrayContaining([
            'password',
            'passwordHash',
            'token',
            'accessToken',
            'refreshToken',
            'cookie',
            'secret',
            'privateKey',
            'providerResponse',
            'stack',
        ]),
    );
}

function user(overrides: Partial<ManagedUser> = {}): ManagedUser {
    return {
        id: 'user-1',
        cognitoSubject: 'cognito-1',
        status: 'DEACTIVATED',
        createdAt: firstTime,
        updatedAt: firstTime,
        activatedAt: null,
        deactivatedAt: firstTime,
        suspendedAt: null,
        statusChangedAt: firstTime,
        statusChangedBy: actor.id,
        statusChangeReason: 'provisioned',
        ...overrides,
    };
}

function harness(initial: ManagedUser | null = null) {
    const records = new Map<string, ManagedUser>(
        initial === null ? [] : [[initial.id, initial]],
    );
    const events: AuditEventInput[] = [];
    const repository: UserManagementRepository = {
        findById: async (id) =>
            [...records.values()].find((item) => item.id === id) ?? null,
        findByCognitoSubject: async (subject) =>
            [...records.values()].find(
                (item) => item.cognitoSubject === subject,
            ) ?? null,
        create: async (input) => {
            const created = user({
                ...input,
                id: input.id ?? 'user-created',
            });
            records.set(created.id, created);
            return created;
        },
        update: async (id, fields) => {
            const existing = records.get(id);
            if (existing === undefined) throw new Error('missing fixture');
            const updated = { ...existing, ...fields };
            records.set(id, updated);
            return updated;
        },
        updateApprovedFields: async (id, fields, updatedAt) => {
            const existing = records.get(id);
            if (existing === undefined) throw new Error('missing fixture');
            const updated = { ...existing, ...fields, updatedAt };
            records.set(id, updated);
            return updated;
        },
    };
    const service = new ManageUsers({
        userRepository: repository,
        authorization: { authorize: async () => true },
        auditWriter: {
            append: async (event): Promise<AuditEvent> => {
                events.push(event);
                return {
                    id: `audit-${events.length}`,
                    ...event,
                    occurredAt: event.occurredAt ?? firstTime,
                    recordedAt: firstTime,
                };
            },
        },
        clock: () => firstTime,
    });
    return { service, events, records, repository };
}

describe('ManageUsers', () => {
    it('provisions a pre-linked subject and records a safe audit event', async () => {
        const { service, events } = harness();

        const created = await service.provision({
            cognitoSubject: 'cognito-new',
            actor,
            reason: 'approved staff account',
        });

        expect(created.status).toBe('DEACTIVATED');
        expectSafeAuditEvent(events[0], {
            eventName: 'user_provisioned',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            targetId: created.id,
            action: 'provision',
            outcome: 'success',
            afterState: { status: 'DEACTIVATED' },
        });
    });

    it('does not provision when authorization denies the operation', async () => {
        const { repository } = harness();
        const events: AuditEventInput[] = [];
        const denied = new ManageUsers({
            userRepository: repository,
            authorization: { authorize: async () => false },
            auditWriter: {
                append: async (event) => {
                    events.push(event);
                    return {
                        id: `audit-${events.length}`,
                        ...event,
                        occurredAt: event.occurredAt ?? firstTime,
                        recordedAt: firstTime,
                    };
                },
            },
        });

        await expect(
            denied.provision({
                cognitoSubject: 'cognito-denied',
                actor,
                reason: 'not approved',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedUserManagementError);

        expectSafeAuditEvent(events[0], {
            eventName: 'authorization_denied',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            action: 'provision',
            outcome: 'failure',
            reason: 'authorization_denied',
        });
    });

    it('rejects duplicate Cognito subjects', async () => {
        const { service, events } = harness(user());

        await expect(
            service.provision({
                cognitoSubject: 'cognito-1',
                actor,
                reason: 'duplicate',
            }),
        ).rejects.toBeInstanceOf(DuplicateCognitoSubjectError);

        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'user_provision_failed',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            action: 'provision',
            outcome: 'failure',
            reason: 'duplicate_cognito_subject',
        });
    });

    it('searches by internal id and Cognito subject through repository ports', async () => {
        const { service } = harness(user());

        await expect(service.findById('user-1', actor)).resolves.toMatchObject({
            id: 'user-1',
        });
        await expect(
            service.findByCognitoSubject('cognito-1', actor),
        ).resolves.toMatchObject({ id: 'user-1' });
    });

    it('enforces explicit transitions and audits each valid transition', async () => {
        const { service, events } = harness(user());
        const input = { id: 'user-1', actor, reason: 'approved change' };

        const activated = await service.activate(input);
        expect(activated).toMatchObject({
            status: 'ACTIVE',
            statusChangedAt: firstTime,
            statusChangedBy: actor.id,
            statusChangeReason: 'approved change',
            activatedAt: firstTime,
            deactivatedAt: null,
            suspendedAt: null,
            updatedAt: firstTime,
        });
        await service.suspend(input);
        await service.reactivate(input);
        await service.deactivate(input);

        expect(events.map((event) => event.eventName)).toEqual([
            'user_activated',
            'user_suspended',
            'user_reactivated',
            'user_deactivated',
        ]);
        expect(events.every((event) => event.outcome === 'success')).toBe(true);
    });

    it('rejects invalid status transitions', async () => {
        const { service } = harness(
            user({ status: 'ACTIVE', deactivatedAt: null }),
        );

        await expect(
            service.activate({
                id: 'user-1',
                actor,
                reason: 'invalid',
            }),
        ).rejects.toBeInstanceOf(InvalidUserStatusTransitionError);
    });

    it('rejects activate for suspended users', async () => {
        const { service, events } = harness(
            user({
                status: 'SUSPENDED',
                deactivatedAt: null,
                suspendedAt: firstTime,
            }),
        );

        await expect(
            service.activate({
                id: 'user-1',
                actor,
                reason: 'invalid suspended-user activation',
            }),
        ).rejects.toBeInstanceOf(InvalidUserStatusTransitionError);

        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'user_transition_failed',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            targetId: 'user-1',
            action: 'activate',
            outcome: 'failure',
            reason: 'invalid_status_transition',
            beforeState: { status: 'SUSPENDED' },
        });
    });

    it('allows only approved updates and keeps Cognito subject immutable', async () => {
        const { service, events } = harness(user());

        const updated = await service.update({
            id: 'user-1',
            actor,
            fields: { statusChangeReason: 'corrected record' },
            reason: 'record correction',
        });
        expect(updated.statusChangeReason).toBe('corrected record');

        await expect(
            service.update({
                id: 'user-1',
                actor,
                fields: { cognitoSubject: 'replacement' },
                reason: 'replace identity',
            }),
        ).rejects.toBeInstanceOf(ImmutableCognitoSubjectError);

        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'user_update_failed',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            targetId: 'user-1',
            action: 'update',
            outcome: 'failure',
            reason: 'immutable_cognito_subject',
        });

        await expect(
            service.update({
                id: 'user-1',
                actor,
                fields: { invalidField: 'test' } as never,
                reason: 'invalid field',
            }),
        ).rejects.toBeInstanceOf(InvalidUserUpdateError);

        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'user_update_failed',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            targetId: 'user-1',
            action: 'update',
            outcome: 'failure',
            reason: 'invalid_user_update_field',
        });
    });

    it('audits authorization denials for user read operations', async () => {
        const { repository } = harness();
        const events: AuditEventInput[] = [];
        const denied = new ManageUsers({
            userRepository: repository,
            authorization: { authorize: async () => false },
            auditWriter: {
                append: async (event) => {
                    events.push(event);
                    return {
                        id: `audit-${events.length}`,
                        ...event,
                        occurredAt: event.occurredAt ?? firstTime,
                        recordedAt: firstTime,
                    };
                },
            },
        });

        await expect(denied.findById('user-1', actor)).rejects.toBeInstanceOf(
            UnauthorizedUserManagementError,
        );

        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'authorization_denied',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            action: 'read',
            outcome: 'failure',
            reason: 'authorization_denied',
            targetId: 'user-1',
        });
    });

    it('audits authorization denials for user update operations', async () => {
        const { repository } = harness();
        const events: AuditEventInput[] = [];
        const denied = new ManageUsers({
            userRepository: repository,
            authorization: { authorize: async () => false },
            auditWriter: {
                append: async (event) => {
                    events.push(event);
                    return {
                        id: `audit-${events.length}`,
                        ...event,
                        occurredAt: event.occurredAt ?? firstTime,
                        recordedAt: firstTime,
                    };
                },
            },
        });

        await expect(
            denied.update({
                id: 'user-1',
                actor,
                fields: { statusChangeReason: 'test' },
                reason: 'test',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedUserManagementError);

        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'authorization_denied',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            action: 'update',
            outcome: 'failure',
            reason: 'authorization_denied',
            targetId: 'user-1',
        });
    });

    it('audits authorization denials for user transition operations', async () => {
        const { repository } = harness();
        const events: AuditEventInput[] = [];
        const denied = new ManageUsers({
            userRepository: repository,
            authorization: { authorize: async () => false },
            auditWriter: {
                append: async (event) => {
                    events.push(event);
                    return {
                        id: `audit-${events.length}`,
                        ...event,
                        occurredAt: event.occurredAt ?? firstTime,
                        recordedAt: firstTime,
                    };
                },
            },
        });

        await expect(
            denied.activate({
                id: 'user-1',
                actor,
                reason: 'test',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedUserManagementError);

        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'authorization_denied',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            action: 'activate',
            outcome: 'failure',
            reason: 'authorization_denied',
            targetId: 'user-1',
        });
    });

    it('audits user not found errors for update operations', async () => {
        const { service, events } = harness();

        await expect(
            service.update({
                id: 'non-existent-user',
                actor,
                fields: { statusChangeReason: 'test' },
                reason: 'test',
            }),
        ).rejects.toBeInstanceOf(UserNotFoundError);

        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'user_not_found',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            action: 'update',
            outcome: 'failure',
            reason: 'user_not_found',
            targetId: 'non-existent-user',
        });
    });

    it('audits user not found errors for transition operations', async () => {
        const { service, events } = harness();

        await expect(
            service.activate({
                id: 'non-existent-user',
                actor,
                reason: 'test',
            }),
        ).rejects.toBeInstanceOf(UserNotFoundError);

        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'user_not_found',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'user',
            action: 'activate',
            outcome: 'failure',
            reason: 'user_not_found',
            targetId: 'non-existent-user',
        });
    });
});
