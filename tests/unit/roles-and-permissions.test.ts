import { describe, expect, it } from 'vitest';
import type {
    AuditEvent,
    AuditEventInput,
} from '../../src/modules/audit/domain/audit-writer.js';
import { ManageRolesAndPermissions } from '../../src/modules/identity-access/application/manage-roles-and-permissions.js';
import type {
    PermissionReference,
    Role,
    RolePermission,
    RolesAndPermissionsRepository,
    UserRoleAssignment,
} from '../../src/modules/identity-access/contracts/roles-and-permissions.js';
import {
    PrivilegeEscalationError,
    RoleNotFoundError,
} from '../../src/modules/identity-access/domain/roles-and-permissions.js';

const firstTime = new Date('2026-09-14T10:00:00.000Z');
const actor = { id: 'admin-1', type: 'user' as const };
const systemActor = { id: 'system', type: 'system' as const };

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
    expect(JSON.stringify(event)).not.toMatch(
        /password|token|cookie|secret|privateKey|stack|providerResponse/i,
    );
}

function role(overrides: Partial<Role> = {}): Role {
    return {
        id: 'role-1',
        key: 'test-role',
        name: 'Test Role',
        description: 'A test role',
        status: 'ACTIVE',
        rank: 0,
        createdAt: firstTime,
        updatedAt: firstTime,
        createdBy: actor.id,
        updatedBy: actor.id,
        deactivatedAt: null,
        deactivatedBy: null,
        deactivationReason: null,
        changeReference: null,
        ...overrides,
    };
}

function rolePermission(
    overrides: Partial<RolePermission> = {},
): RolePermission {
    return {
        id: 'rp-1',
        roleId: 'role-1',
        permissionId: 'identity-access.user.read',
        status: 'ACTIVE',
        assignedAt: firstTime,
        assignedBy: actor.id,
        assignmentReason: 'test',
        revokedAt: null,
        revokedBy: null,
        revocationReason: null,
        createdAt: firstTime,
        updatedAt: firstTime,
        changeReference: null,
        ...overrides,
    };
}

function userRoleAssignment(
    overrides: Partial<UserRoleAssignment> = {},
): UserRoleAssignment {
    return {
        id: 'ura-1',
        userId: 'user-1',
        roleId: 'role-1',
        status: 'ACTIVE',
        assignedAt: firstTime,
        assignedBy: actor.id,
        revokedAt: null,
        revokedBy: null,
        assignmentReason: 'test',
        revocationReason: null,
        createdAt: firstTime,
        updatedAt: firstTime,
        changeReference: null,
        ...overrides,
    };
}

function permissionReference(
    overrides: Partial<PermissionReference> = {},
): PermissionReference {
    return {
        id: 'identity-access.user.read',
        ...overrides,
    };
}

function harness(
    initialRoles: Role[] = [],
    initialAssignments: UserRoleAssignment[] = [],
    initialRolePermissions: RolePermission[] = [],
) {
    const roles = new Map<string, Role>(initialRoles.map((r) => [r.id, r]));
    // Also index by key for easier lookup
    const rolesByKey = new Map<string, Role>(
        initialRoles.map((r) => [r.key, r]),
    );
    const assignments = new Map<string, UserRoleAssignment>(
        initialAssignments.map((a) => [a.id, a]),
    );
    const rolePermissions = new Map<string, RolePermission>(
        initialRolePermissions.map((rp) => [rp.id, rp]),
    );
    const permissions = new Map<string, PermissionReference>();
    const events: AuditEventInput[] = [];
    let bootstrapControl: {
        id: string;
        consumedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        consumedBy: string | null;
        changeReference: string | null;
    } | null = null;

    const repository: RolesAndPermissionsRepository = {
        findRoleById: async (id) => roles.get(id) ?? null,
        findRoleByKey: async (key) => rolesByKey.get(key) ?? null,
        createRole: async (input) => {
            const created = role({
                ...input,
                id: input.id ?? `role-${roles.size + 1}`,
            });
            roles.set(created.id, created);
            rolesByKey.set(created.key, created);
            return created;
        },
        updateRole: async (id, fields) => {
            const existing = roles.get(id);
            if (existing === undefined) throw new Error('missing fixture');
            const updated = { ...existing, ...fields };
            roles.set(id, updated);
            rolesByKey.set(updated.key, updated);
            return updated;
        },
        deactivateRole: async (id, fields) => {
            const existing = roles.get(id);
            if (existing === undefined) throw new Error('missing fixture');
            const updated = { ...existing, ...fields };
            roles.set(id, updated);
            rolesByKey.set(updated.key, updated);
            return updated;
        },
        findPermissionById: async (id) => permissions.get(id) ?? null,
        createPermission: async (input) => {
            const created = permissionReference(input);
            permissions.set(created.id, created);
            return created;
        },
        findActiveRolePermission: async (roleId, permissionId) => {
            return (
                [...rolePermissions.values()].find(
                    (rp) =>
                        rp.roleId === roleId &&
                        rp.permissionId === permissionId &&
                        rp.status === 'ACTIVE',
                ) ?? null
            );
        },
        createRolePermission: async (input) => {
            const created = rolePermission({
                ...input,
                id: input.id ?? `rp-${rolePermissions.size + 1}`,
            });
            rolePermissions.set(created.id, created);
            return created;
        },
        revokeRolePermission: async (id, fields) => {
            const existing = rolePermissions.get(id);
            if (existing === undefined) throw new Error('missing fixture');
            const updated = { ...existing, ...fields };
            rolePermissions.set(id, updated);
            return updated;
        },
        findActivePermissionsForRole: async (roleId) => {
            return [...rolePermissions.values()].filter(
                (rp) => rp.roleId === roleId && rp.status === 'ACTIVE',
            );
        },
        findActiveUserRoleAssignment: async (userId, roleId) => {
            return (
                [...assignments.values()].find(
                    (a) =>
                        a.userId === userId &&
                        a.roleId === roleId &&
                        a.status === 'ACTIVE',
                ) ?? null
            );
        },
        createUserRoleAssignment: async (input) => {
            const created = userRoleAssignment({
                ...input,
                id: input.id ?? `ura-${assignments.size + 1}`,
            });
            assignments.set(created.id, created);
            return created;
        },
        revokeUserRoleAssignment: async (id, fields) => {
            const existing = assignments.get(id);
            if (existing === undefined) throw new Error('missing fixture');
            const updated = { ...existing, ...fields };
            assignments.set(id, updated);
            return updated;
        },
        findActiveRolesForUser: async (userId) => {
            return [...assignments.values()].filter(
                (a) => a.userId === userId && a.status === 'ACTIVE',
            );
        },
        findBootstrapControl: async () => {
            const bootstrap = bootstrapControl;
            if (bootstrap === null) return null;
            return { id: bootstrap.id, consumedAt: bootstrap.consumedAt };
        },
        createBootstrapControl: async (input) => {
            const created = {
                id: input.id,
                consumedAt: null,
                createdAt: input.createdAt,
                updatedAt: input.updatedAt,
                consumedBy: null,
                changeReference: null,
            };
            bootstrapControl = created;
            return created;
        },
        consumeBootstrapControl: async (id, fields) => {
            if (bootstrapControl === null) throw new Error('missing fixture');
            bootstrapControl = {
                ...bootstrapControl,
                consumedAt: fields.consumedAt,
                consumedBy: fields.consumedBy,
                changeReference: fields.changeReference,
                updatedAt: fields.updatedAt,
            };
        },
    };

    const service = new ManageRolesAndPermissions({
        repository,
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
        authorization: { authorize: async () => true },
        clock: () => firstTime,
    });

    return {
        service,
        events,
        roles,
        assignments,
        rolePermissions,
        repository,
        bootstrapControl,
    };
}

describe('ManageRolesAndPermissions - Rank-based Delegation Authority', () => {
    it('audits every implemented role and permission event with safe fields', async () => {
        const actorAssignment = userRoleAssignment({
            userId: actor.id,
            roleId: 'role-authority',
            id: 'ura-actor',
        });
        const authorityRole = role({
            id: 'role-authority',
            key: 'authority',
            rank: 10,
        });
        const targetRole = role({
            id: 'role-target',
            key: 'target',
            rank: 5,
        });
        const lifecycleRole = role({
            id: 'role-1',
            key: 'lifecycle',
            rank: 0,
        });
        const { service, events } = harness(
            [authorityRole, targetRole, lifecycleRole],
            [actorAssignment],
        );
        const correlationId = 'iam-audit-coverage-1';

        await service.createRole({
            key: 'created-role',
            name: 'Created Role',
            actor,
            reason: 'create test role',
            correlationId,
        });
        await service.modifyRole({
            id: 'role-1',
            name: 'Modified Role',
            actor,
            reason: 'modify test role',
            correlationId,
        });
        await service.deactivateRole({
            id: 'role-1',
            actor,
            reason: 'deactivate test role',
            correlationId,
        });
        await service.grantPermission({
            roleId: 'role-target',
            permissionId: 'identity-access.user.read',
            actor,
            reason: 'grant test permission',
            correlationId,
        });
        await service.revokePermission({
            roleId: 'role-target',
            permissionId: 'identity-access.user.read',
            actor,
            reason: 'revoke test permission',
            correlationId,
        });
        await service.assignRole({
            userId: 'user-2',
            roleId: 'role-target',
            actor,
            reason: 'assign test role',
            correlationId,
        });
        await service.revokeRole({
            userId: 'user-2',
            roleId: 'role-target',
            actor,
            reason: 'revoke test role',
            correlationId,
        });

        const expectedEvents = [
            ['role_created', 'role', 'create', 'success'],
            ['role_modified', 'role', 'modify', 'success'],
            ['role_deactivated', 'role', 'deactivate', 'success'],
            ['permission_granted', 'permission', 'grant', 'success'],
            ['permission_revoked', 'permission', 'revoke', 'success'],
            ['role_assigned', 'role', 'assign', 'success'],
            ['role_revoked', 'role', 'revoke', 'success'],
        ] as const;

        for (const [index, [eventName, targetType, action, outcome]] of expectedEvents.entries()) {
            expectSafeAuditEvent(events[index], {
                eventName,
                actorId: actor.id,
                actorType: actor.type,
                targetType,
                action,
                outcome,
                correlationId,
            });
        }
    });

    it('audits authorization_denied with safe target and correlation fields', async () => {
        const { repository } = harness();
        const events: AuditEventInput[] = [];
        const service = new ManageRolesAndPermissions({
            repository,
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
            authorization: { authorize: async () => false },
            clock: () => firstTime,
        });

        await expect(
            service.createRole({
                key: 'denied-role',
                name: 'Denied Role',
                actor,
                reason: 'denied create',
                correlationId: 'iam-audit-denied-1',
            }),
        ).rejects.toThrow();

        expectSafeAuditEvent(events[0], {
            eventName: 'authorization_denied',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'role',
            action: 'role.create',
            outcome: 'failure',
            reason: 'authorization_denied',
        });
    });

    it('audits privilege escalation and bootstrap establishment safely', async () => {
        const lowRankRole = role({
            id: 'role-low',
            key: 'low-rank',
            rank: 5,
        });
        const highRankRole = role({
            id: 'role-high',
            key: 'high-rank',
            rank: 10,
        });
        const { service, events } = harness(
            [lowRankRole, highRankRole],
            [userRoleAssignment({
                userId: actor.id,
                roleId: 'role-low',
                id: 'ura-actor',
            })],
        );

        await expect(
            service.assignRole({
                userId: 'user-2',
                roleId: 'role-high',
                actor,
                reason: 'blocked escalation',
                correlationId: 'iam-audit-escalation-1',
            }),
        ).rejects.toThrow();
        expectSafeAuditEvent(events[events.length - 1], {
            eventName: 'privilege_escalation_blocked',
            actorId: actor.id,
            actorType: actor.type,
            targetType: 'role',
            targetId: 'role-high',
            action: 'role.assign',
            outcome: 'failure',
            reason: 'target_rank_not_strictly_less_than_actor_rank',
        });

        const bootstrapEvents: AuditEventInput[] = [];
        const bootstrapRole = role({
            id: 'role-sysadmin',
            key: 'system-administrator',
            rank: 9999,
        });
        const bootstrap = harness([bootstrapRole]);
        const bootstrapService = new ManageRolesAndPermissions({
            repository: bootstrap.repository,
            auditWriter: {
                append: async (event): Promise<AuditEvent> => {
                    bootstrapEvents.push(event);
                    return {
                        id: `audit-${bootstrapEvents.length}`,
                        ...event,
                        occurredAt: event.occurredAt ?? firstTime,
                        recordedAt: firstTime,
                    };
                },
            },
            authorization: { authorize: async () => true },
            clock: () => firstTime,
        });

        await bootstrapService.bootstrapAdministrator({
            userId: 'user-1',
            actor: systemActor,
            reason: 'establish bootstrap administrator',
            correlationId: 'iam-audit-bootstrap-1',
        });
        expectSafeAuditEvent(bootstrapEvents[bootstrapEvents.length - 1], {
            eventName: 'bootstrap_administrator_established',
            actorId: systemActor.id,
            actorType: systemActor.type,
            targetType: 'administrator',
            targetId: 'user-1',
            action: 'bootstrap',
            outcome: 'success',
            correlationId: 'iam-audit-bootstrap-1',
        });
    });

    describe('Normal assignment within authority', () => {
        it('allows actor with higher rank to assign role with lower rank', async () => {
            const highRankRole = role({
                id: 'role-high',
                key: 'high-rank',
                rank: 10,
            });
            const lowRankRole = role({
                id: 'role-low',
                key: 'low-rank',
                rank: 5,
            });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-high',
                id: 'ura-actor',
            });

            const { service, events } = harness(
                [highRankRole, lowRankRole],
                [actorAssignment],
            );

            await service.assignRole({
                userId: 'user-2',
                roleId: 'role-low',
                actor,
                reason: 'authorized assignment',
            });

            expect(events[events.length - 1]).toMatchObject({
                eventName: 'role_assigned',
                actorId: actor.id,
                outcome: 'success',
            });
        });
    });

    describe('Denial for higher-rank target', () => {
        it('blocks actor from assigning role with higher rank than their own', async () => {
            const lowRankRole = role({
                id: 'role-low',
                key: 'low-rank',
                rank: 5,
            });
            const highRankRole = role({
                id: 'role-high',
                key: 'high-rank',
                rank: 10,
            });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-low',
                id: 'ura-actor',
            });

            const { service, events } = harness(
                [lowRankRole, highRankRole],
                [actorAssignment],
            );

            await expect(
                service.assignRole({
                    userId: 'user-2',
                    roleId: 'role-high',
                    actor,
                    reason: 'unauthorized assignment',
                }),
            ).rejects.toBeInstanceOf(PrivilegeEscalationError);

            const auditEvent = events[events.length - 1];
            expect(auditEvent).toBeDefined();
            expect(auditEvent).toMatchObject({
                eventName: 'privilege_escalation_blocked',
                actorId: actor.id,
                outcome: 'failure',
                reason: 'target_rank_not_strictly_less_than_actor_rank',
            });
            expect(auditEvent?.afterState).toMatchObject({
                actorHighestRank: 5,
                targetRank: 10,
            });
        });
    });

    describe('Denial for equal-rank target', () => {
        it('blocks actor from assigning role at the same rank as their own (strictly less than)', async () => {
            const rank5Role1 = role({ id: 'role-5a', key: 'rank-5a', rank: 5 });
            const rank5Role2 = role({ id: 'role-5b', key: 'rank-5b', rank: 5 });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-5a',
                id: 'ura-actor',
            });

            const { service, events } = harness(
                [rank5Role1, rank5Role2],
                [actorAssignment],
            );

            await expect(
                service.assignRole({
                    userId: 'user-2',
                    roleId: 'role-5b',
                    actor,
                    reason: 'equal rank assignment',
                }),
            ).rejects.toBeInstanceOf(PrivilegeEscalationError);

            const auditEvent = events[events.length - 1];
            expect(auditEvent).toBeDefined();
            expect(auditEvent).toMatchObject({
                eventName: 'privilege_escalation_blocked',
                actorId: actor.id,
                outcome: 'failure',
                reason: 'target_rank_not_strictly_less_than_actor_rank',
            });
            expect(auditEvent?.afterState).toMatchObject({
                actorHighestRank: 5,
                targetRank: 5,
            });
        });
    });

    describe('Denial for zero-role actor', () => {
        it('blocks actor with zero active roles from attempting any role assignment', async () => {
            const targetRole = role({
                id: 'role-target',
                key: 'target',
                rank: 5,
            });

            const { service, events } = harness([targetRole], []);

            await expect(
                service.assignRole({
                    userId: 'user-2',
                    roleId: 'role-target',
                    actor,
                    reason: 'no authority assignment',
                }),
            ).rejects.toBeInstanceOf(PrivilegeEscalationError);

            const auditEvent = events[events.length - 1];
            expect(auditEvent).toBeDefined();
            expect(auditEvent).toMatchObject({
                eventName: 'privilege_escalation_blocked',
                actorId: actor.id,
                outcome: 'failure',
                reason: 'actor_has_no_active_roles',
            });
        });
    });

    describe('Permission grant with rank-based checks', () => {
        it('blocks permission grant to role with equal or higher rank', async () => {
            const lowRankRole = role({
                id: 'role-low',
                key: 'low-rank',
                rank: 5,
            });
            const highRankRole = role({
                id: 'role-high',
                key: 'high-rank',
                rank: 10,
            });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-low',
                id: 'ura-actor',
            });

            const { service, events, repository } = harness(
                [lowRankRole, highRankRole],
                [actorAssignment],
            );

            // Verify the high-rank role exists
            const foundRole = await repository.findRoleById('role-high');
            expect(foundRole).not.toBeNull();
            expect(foundRole?.rank).toBe(10);

            await expect(
                service.grantPermission({
                    roleId: 'role-high',
                    permissionId: 'identity-access.user.read',
                    actor,
                    reason: 'unauthorized grant',
                }),
            ).rejects.toBeInstanceOf(PrivilegeEscalationError);

            const auditEvent = events[events.length - 1];
            expect(auditEvent).toBeDefined();
            expect(auditEvent).toMatchObject({
                eventName: 'privilege_escalation_blocked',
                actorId: actor.id,
                outcome: 'failure',
                reason: 'target_rank_not_strictly_less_than_actor_rank',
            });
        });
    });

    describe('System-administrator role protection', () => {
        it('blocks normal role assignment for system-administrator role', async () => {
            const systemAdminRole = role({
                id: 'role-sysadmin',
                key: 'system-administrator',
                rank: 9999,
            });
            const highRankRole = role({
                id: 'role-high',
                key: 'high-rank',
                rank: 100,
            });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-high',
                id: 'ura-actor',
            });

            const { service, events } = harness(
                [systemAdminRole, highRankRole],
                [actorAssignment],
            );

            await expect(
                service.assignRole({
                    userId: 'user-2',
                    roleId: 'role-sysadmin',
                    actor,
                    reason: 'attempt sysadmin assignment',
                }),
            ).rejects.toBeInstanceOf(PrivilegeEscalationError);

            const auditEvent = events[events.length - 1];
            expect(auditEvent).toMatchObject({
                eventName: 'privilege_escalation_blocked',
                actorId: actor.id,
                outcome: 'failure',
                reason: 'system_administrator_bootstrap_only',
            });
        });
    });

    describe('Role creation with rank assignment', () => {
        it('creates system-administrator role with highest rank', async () => {
            const { service, events } = harness();

            const created = await service.createRole({
                key: 'system-administrator',
                name: 'System Administrator',
                actor,
                reason: 'bootstrap role creation',
            });

            expect(created.rank).toBe(9999);
            expect(events[events.length - 1]).toMatchObject({
                eventName: 'role_created',
                afterState: { rank: 9999 },
            });
        });

        it('creates regular roles with default rank 0', async () => {
            const { service, events } = harness();

            const created = await service.createRole({
                key: 'regular-role',
                name: 'Regular Role',
                actor,
                reason: 'regular role creation',
            });

            expect(created.rank).toBe(0);
            expect(events[events.length - 1]).toMatchObject({
                eventName: 'role_created',
                afterState: { rank: 0 },
            });
        });
    });

    describe('Bootstrap system administrator assignment', () => {
        it('allows system-administrator assignment through bootstrap flow', async () => {
            const systemAdminRole = role({
                id: 'role-sysadmin',
                key: 'system-administrator',
                rank: 9999,
            });

            const { service, events } = harness([systemAdminRole]);

            await service.assignSystemAdministratorRole({
                userId: 'user-1',
                actor: systemActor,
                reason: 'bootstrap assignment',
            });

            expect(events[events.length - 1]).toMatchObject({
                eventName: 'role_assigned',
                actorId: systemActor.id,
                outcome: 'success',
                afterState: {
                    roleKey: 'system-administrator',
                    rank: 9999,
                },
            });
        });

        it('fails if system-administrator role does not exist', async () => {
            const { service, events } = harness();

            await expect(
                service.assignSystemAdministratorRole({
                    userId: 'user-1',
                    actor: systemActor,
                    reason: 'bootstrap assignment',
                }),
            ).rejects.toBeInstanceOf(RoleNotFoundError);

            expect(events[events.length - 1]).toMatchObject({
                eventName: 'role_assignment_failed',
                reason: 'system_administrator_role_not_found',
            });
        });

        it('actually assigns the system-administrator role to the target user', async () => {
            const systemAdminRole = role({
                id: 'role-sysadmin',
                key: 'system-administrator',
                rank: 9999,
            });

            const { service, events, assignments } = harness([systemAdminRole]);

            await service.bootstrapAdministrator({
                userId: 'user-1',
                actor: systemActor,
                reason: 'bootstrap assignment',
            });

            // Verify the audit event was written
            expect(events[events.length - 1]).toMatchObject({
                eventName: 'bootstrap_administrator_established',
                actorId: systemActor.id,
                outcome: 'success',
                targetId: 'user-1',
            });

            // CRITICAL: Verify the user actually HAS the system-administrator role assignment
            const roleAssignment = [...assignments.values()].find(
                (a) =>
                    a.userId === 'user-1' &&
                    a.roleId === 'role-sysadmin' &&
                    a.status === 'ACTIVE',
            );
            expect(roleAssignment).not.toBeUndefined();
            expect(roleAssignment?.status).toBe('ACTIVE');
            expect(roleAssignment?.userId).toBe('user-1');
            expect(roleAssignment?.roleId).toBe('role-sysadmin');
        });

        it('does not consume bootstrap token if role assignment fails', async () => {
            const { service, events, bootstrapControl } = harness([]); // No system-administrator role exists

            await expect(
                service.bootstrapAdministrator({
                    userId: 'user-1',
                    actor: systemActor,
                    reason: 'bootstrap assignment',
                }),
            ).rejects.toThrow();

            // Verify failure audit event was written
            expect(events[events.length - 1]).toMatchObject({
                eventName: 'bootstrap_failed',
                actorId: systemActor.id,
                outcome: 'failure',
                reason: 'role_assignment_failed',
            });

            // Verify bootstrap control was NOT consumed
            expect(bootstrapControl).toBeNull();
        });
    });

    describe('Layered authorization check', () => {
        it('requires both permission AND rank check to pass', async () => {
            const highRankRole = role({
                id: 'role-high',
                key: 'high-rank',
                rank: 10,
            });
            const lowRankRole = role({
                id: 'role-low',
                key: 'low-rank',
                rank: 5,
            });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-high',
                id: 'ura-actor',
            });

            const { repository } = harness(
                [highRankRole, lowRankRole],
                [actorAssignment],
            );
            const events: AuditEventInput[] = [];

            const deniedService = new ManageRolesAndPermissions({
                repository,
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
                authorization: { authorize: async () => false }, // Permission denied
                clock: () => firstTime,
            });

            await expect(
                deniedService.assignRole({
                    userId: 'user-2',
                    roleId: 'role-low',
                    actor,
                    reason: 'test',
                }),
            ).rejects.toThrow();

            // Should fail on permission check first, not rank check
            expect(events[events.length - 1]).toMatchObject({
                eventName: 'authorization_denied',
                reason: 'authorization_denied',
            });
        });
    });

    describe('Revoke-path privilege escalation protection', () => {
        it('blocks actor from revoking role with higher rank than their own', async () => {
            const lowRankRole = role({
                id: 'role-low',
                key: 'low-rank',
                rank: 5,
            });
            const highRankRole = role({
                id: 'role-high',
                key: 'high-rank',
                rank: 10,
            });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-low',
                id: 'ura-actor',
            });
            const targetAssignment = userRoleAssignment({
                userId: 'user-2',
                roleId: 'role-high',
                id: 'ura-target',
            });

            const { service, events } = harness(
                [lowRankRole, highRankRole],
                [actorAssignment, targetAssignment],
            );

            await expect(
                service.revokeRole({
                    userId: 'user-2',
                    roleId: 'role-high',
                    actor,
                    reason: 'unauthorized revocation',
                }),
            ).rejects.toBeInstanceOf(PrivilegeEscalationError);

            const auditEvent = events[events.length - 1];
            expect(auditEvent).toBeDefined();
            expect(auditEvent).toMatchObject({
                eventName: 'privilege_escalation_blocked',
                actorId: actor.id,
                outcome: 'failure',
                reason: 'target_rank_not_strictly_less_than_actor_rank',
            });
            expect(auditEvent?.afterState).toMatchObject({
                actorHighestRank: 5,
                targetRank: 10,
            });
        });

        it('blocks actor from revoking role at the same rank as their own', async () => {
            const rank5Role1 = role({ id: 'role-5a', key: 'rank-5a', rank: 5 });
            const rank5Role2 = role({ id: 'role-5b', key: 'rank-5b', rank: 5 });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-5a',
                id: 'ura-actor',
            });
            const targetAssignment = userRoleAssignment({
                userId: 'user-2',
                roleId: 'role-5b',
                id: 'ura-target',
            });

            const { service, events } = harness(
                [rank5Role1, rank5Role2],
                [actorAssignment, targetAssignment],
            );

            await expect(
                service.revokeRole({
                    userId: 'user-2',
                    roleId: 'role-5b',
                    actor,
                    reason: 'equal rank revocation',
                }),
            ).rejects.toBeInstanceOf(PrivilegeEscalationError);

            const auditEvent = events[events.length - 1];
            expect(auditEvent).toBeDefined();
            expect(auditEvent).toMatchObject({
                eventName: 'privilege_escalation_blocked',
                actorId: actor.id,
                outcome: 'failure',
                reason: 'target_rank_not_strictly_less_than_actor_rank',
            });
            expect(auditEvent?.afterState).toMatchObject({
                actorHighestRank: 5,
                targetRank: 5,
            });
        });

        it('blocks permission revocation from role with higher rank', async () => {
            const lowRankRole = role({
                id: 'role-low',
                key: 'low-rank',
                rank: 5,
            });
            const highRankRole = role({
                id: 'role-high',
                key: 'high-rank',
                rank: 10,
            });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-low',
                id: 'ura-actor',
            });
            const highRankPermission = rolePermission({
                id: 'rp-high',
                roleId: 'role-high',
                permissionId: 'identity-access.user.read',
            });

            const { service, events } = harness(
                [lowRankRole, highRankRole],
                [actorAssignment],
                [highRankPermission],
            );

            await expect(
                service.revokePermission({
                    roleId: 'role-high',
                    permissionId: 'identity-access.user.read',
                    actor,
                    reason: 'unauthorized revocation',
                }),
            ).rejects.toBeInstanceOf(PrivilegeEscalationError);

            const auditEvent = events[events.length - 1];
            expect(auditEvent).toBeDefined();
            expect(auditEvent).toMatchObject({
                eventName: 'privilege_escalation_blocked',
                actorId: actor.id,
                outcome: 'failure',
                reason: 'target_rank_not_strictly_less_than_actor_rank',
            });
            expect(auditEvent?.afterState).toMatchObject({
                actorHighestRank: 5,
                targetRank: 10,
            });
        });

        it('allows revocation of role with lower rank', async () => {
            const highRankRole = role({
                id: 'role-high',
                key: 'high-rank',
                rank: 10,
            });
            const lowRankRole = role({
                id: 'role-low',
                key: 'low-rank',
                rank: 5,
            });
            const actorAssignment = userRoleAssignment({
                userId: actor.id,
                roleId: 'role-high',
                id: 'ura-actor',
            });
            const targetAssignment = userRoleAssignment({
                userId: 'user-2',
                roleId: 'role-low',
                id: 'ura-target',
            });

            const { service, events } = harness(
                [highRankRole, lowRankRole],
                [actorAssignment, targetAssignment],
            );

            await service.revokeRole({
                userId: 'user-2',
                roleId: 'role-low',
                actor,
                reason: 'authorized revocation',
            });

            expect(events[events.length - 1]).toMatchObject({
                eventName: 'role_revoked',
                actorId: actor.id,
                outcome: 'success',
            });
        });
    });
});
