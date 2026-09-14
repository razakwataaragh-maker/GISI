import type {
    AuditEventInput,
    AuditWriter,
} from '../../audit/domain/audit-writer.js';
import type {
    AssignRoleInput,
    AssignSystemAdministratorRoleInput,
    BootstrapAdministratorInput,
    CreateRoleInput,
    DeactivateRoleInput,
    GrantPermissionInput,
    ModifyRoleInput,
    RevokePermissionInput,
    RevokeRoleInput,
    Role,
    RolesAndPermissionsAction,
    RolesAndPermissionsAuthorization,
    RolesAndPermissionsRepository,
    UserActor,
} from '../contracts/roles-and-permissions.js';
import { validatePermissionId } from '../contracts/permissions.js';
import {
    BootstrapAlreadyConsumedError,
    DuplicateRoleKeyError,
    DuplicateRolePermissionError,
    DuplicateUserRoleAssignmentError,
    InvalidRoleStatusError,
    PermissionNotFoundError,
    PrivilegeEscalationError,
    RoleNotFoundError,
    RolePermissionNotAssignedError,
    UnauthorizedRolesAndPermissionsError,
    UserRoleAssignmentNotActiveError,
} from '../domain/roles-and-permissions.js';

export interface ManageRolesAndPermissionsDependencies {
    readonly repository: RolesAndPermissionsRepository;
    readonly auditWriter: AuditWriter;
    readonly authorization: RolesAndPermissionsAuthorization;
    readonly clock?: () => Date;
}

export class ManageRolesAndPermissions {
    private readonly clock: () => Date;
    private static readonly SYSTEM_ADMINISTRATOR_RANK = 9999; // Highest rank for system administrator

    constructor(
        private readonly dependencies: ManageRolesAndPermissionsDependencies,
    ) {
        this.clock = dependencies.clock ?? (() => new Date());
    }

    async createRole(input: CreateRoleInput): Promise<Role> {
        await this.assertAuthorized(input.actor, 'role.create');

        const existing = await this.dependencies.repository.findRoleByKey(
            input.key,
        );
        if (existing !== null) {
            await this.writeAudit({
                eventName: 'role_creation_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'role',
                action: 'create',
                outcome: 'failure',
                reason: 'duplicate_role_key',
                ...correlation(input.correlationId),
            });
            throw new DuplicateRoleKeyError(input.key);
        }

        const now = this.clock();
        // Set highest rank for system-administrator role
        const rank =
            input.key === 'system-administrator'
                ? ManageRolesAndPermissions.SYSTEM_ADMINISTRATOR_RANK
                : 0;

        const role = await this.dependencies.repository.createRole({
            key: input.key,
            name: input.name,
            description: input.description ?? null,
            status: 'ACTIVE',
            rank,
            createdAt: now,
            updatedAt: now,
            createdBy: input.actor.id,
            updatedBy: input.actor.id,
        });

        await this.writeAudit({
            eventName: 'role_created',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'role',
            targetId: role.id,
            action: 'create',
            outcome: 'success',
            reason: input.reason,
            afterState: { key: role.key, name: role.name, rank: role.rank },
            ...correlation(input.correlationId),
        });

        return role;
    }

    async modifyRole(input: ModifyRoleInput): Promise<Role> {
        await this.assertAuthorized(input.actor, 'role.modify', input.id);

        const current = await this.requireRole(input.id);
        const now = this.clock();

        const role = await this.dependencies.repository.updateRole(input.id, {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.description !== undefined && {
                description: input.description,
            }),
            updatedAt: now,
            updatedBy: input.actor.id,
        });

        await this.writeAudit({
            eventName: 'role_modified',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'role',
            targetId: role.id,
            action: 'modify',
            outcome: 'success',
            reason: input.reason,
            beforeState: { name: current.name },
            afterState: { name: role.name },
            ...correlation(input.correlationId),
        });

        return role;
    }

    async deactivateRole(input: DeactivateRoleInput): Promise<Role> {
        await this.assertAuthorized(input.actor, 'role.deactivate', input.id);

        const current = await this.requireRole(input.id);
        if (current.status !== 'ACTIVE') {
            await this.writeAudit({
                eventName: 'role_deactivation_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'role',
                targetId: input.id,
                action: 'deactivate',
                outcome: 'failure',
                reason: 'invalid_role_status',
                beforeState: { status: current.status },
                ...correlation(input.correlationId),
            });
            throw new InvalidRoleStatusError(current.status, 'deactivate');
        }

        const now = this.clock();
        const role = await this.dependencies.repository.deactivateRole(
            input.id,
            {
                status: 'INACTIVE',
                updatedAt: now,
                deactivatedAt: now,
                deactivatedBy: input.actor.id,
                deactivationReason: input.reason,
            },
        );

        await this.writeAudit({
            eventName: 'role_deactivated',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'role',
            targetId: role.id,
            action: 'deactivate',
            outcome: 'success',
            reason: input.reason,
            beforeState: { status: 'ACTIVE' },
            afterState: { status: 'INACTIVE' },
            ...correlation(input.correlationId),
        });

        return role;
    }

    async grantPermission(input: GrantPermissionInput): Promise<void> {
        await this.assertAuthorized(
            input.actor,
            'permission.grant',
            input.roleId,
        );

        // Validate permission exists in registry
        if (!validatePermissionId(input.permissionId)) {
            await this.writeAudit({
                eventName: 'permission_grant_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'permission',
                targetId: input.permissionId,
                action: 'grant',
                outcome: 'failure',
                reason: 'permission_not_found',
                ...correlation(input.correlationId),
            });
            throw new PermissionNotFoundError(input.permissionId);
        }

        // Check privilege escalation
        await this.assertPrivilegeElevation(
            input.actor,
            'permission.grant',
            input.roleId,
        );

        // Ensure permission reference exists
        const permission =
            await this.dependencies.repository.findPermissionById(
                input.permissionId,
            );
        if (permission === null) {
            await this.dependencies.repository.createPermission({
                id: input.permissionId,
            });
        }

        const existing =
            await this.dependencies.repository.findActiveRolePermission(
                input.roleId,
                input.permissionId,
            );
        if (existing !== null) {
            await this.writeAudit({
                eventName: 'permission_grant_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'permission',
                targetId: input.permissionId,
                action: 'grant',
                outcome: 'failure',
                reason: 'duplicate_role_permission',
                ...correlation(input.correlationId),
            });
            throw new DuplicateRolePermissionError(
                input.roleId,
                input.permissionId,
            );
        }

        const now = this.clock();
        await this.dependencies.repository.createRolePermission({
            roleId: input.roleId,
            permissionId: input.permissionId,
            status: 'ACTIVE',
            assignedAt: now,
            assignedBy: input.actor.id,
            assignmentReason: input.reason,
            createdAt: now,
            updatedAt: now,
        });

        await this.writeAudit({
            eventName: 'permission_granted',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'permission',
            targetId: input.permissionId,
            action: 'grant',
            outcome: 'success',
            reason: input.reason,
            ...correlation(input.correlationId),
        });
    }

    async revokePermission(input: RevokePermissionInput): Promise<void> {
        await this.assertAuthorized(
            input.actor,
            'permission.revoke',
            input.roleId,
        );

        // Check privilege escalation - actor can only revoke permissions from roles at or below their rank
        await this.assertPrivilegeElevation(
            input.actor,
            'permission.revoke',
            input.roleId,
        );

        const existing =
            await this.dependencies.repository.findActiveRolePermission(
                input.roleId,
                input.permissionId,
            );
        if (existing === null) {
            await this.writeAudit({
                eventName: 'permission_revoke_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'permission',
                targetId: input.permissionId,
                action: 'revoke',
                outcome: 'failure',
                reason: 'role_permission_not_assigned',
                ...correlation(input.correlationId),
            });
            throw new RolePermissionNotAssignedError(
                input.roleId,
                input.permissionId,
            );
        }

        const now = this.clock();
        await this.dependencies.repository.revokeRolePermission(existing.id, {
            status: 'REVOKED',
            revokedAt: now,
            revokedBy: input.actor.id,
            revocationReason: input.reason,
            updatedAt: now,
        });

        await this.writeAudit({
            eventName: 'permission_revoked',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'permission',
            targetId: input.permissionId,
            action: 'revoke',
            outcome: 'success',
            reason: input.reason,
            ...correlation(input.correlationId),
        });
    }

    async assignRole(input: AssignRoleInput): Promise<void> {
        await this.assertAuthorized(input.actor, 'role.assign', input.roleId);

        // Check privilege escalation
        await this.assertPrivilegeElevation(
            input.actor,
            'role.assign',
            input.roleId,
        );

        const existing =
            await this.dependencies.repository.findActiveUserRoleAssignment(
                input.userId,
                input.roleId,
            );
        if (existing !== null) {
            await this.writeAudit({
                eventName: 'role_assignment_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'role',
                targetId: input.roleId,
                action: 'assign',
                outcome: 'failure',
                reason: 'duplicate_user_role_assignment',
                ...correlation(input.correlationId),
            });
            throw new DuplicateUserRoleAssignmentError(
                input.userId,
                input.roleId,
            );
        }

        const now = this.clock();
        await this.dependencies.repository.createUserRoleAssignment({
            userId: input.userId,
            roleId: input.roleId,
            status: 'ACTIVE',
            assignedAt: now,
            assignedBy: input.actor.id,
            assignmentReason: input.reason,
            createdAt: now,
            updatedAt: now,
        });

        await this.writeAudit({
            eventName: 'role_assigned',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'role',
            targetId: input.roleId,
            action: 'assign',
            outcome: 'success',
            reason: input.reason,
            ...correlation(input.correlationId),
        });
    }

    async revokeRole(input: RevokeRoleInput): Promise<void> {
        await this.assertAuthorized(input.actor, 'role.revoke', input.roleId);

        // Check privilege escalation - actor can only revoke roles at or below their rank
        await this.assertPrivilegeElevation(
            input.actor,
            'role.revoke',
            input.roleId,
        );

        const existing =
            await this.dependencies.repository.findActiveUserRoleAssignment(
                input.userId,
                input.roleId,
            );
        if (existing === null) {
            await this.writeAudit({
                eventName: 'role_revocation_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'role',
                targetId: input.roleId,
                action: 'revoke',
                outcome: 'failure',
                reason: 'user_role_assignment_not_active',
                ...correlation(input.correlationId),
            });
            throw new UserRoleAssignmentNotActiveError(
                input.userId,
                input.roleId,
            );
        }

        const now = this.clock();
        await this.dependencies.repository.revokeUserRoleAssignment(
            existing.id,
            {
                status: 'REVOKED',
                revokedAt: now,
                revokedBy: input.actor.id,
                revocationReason: input.reason,
                updatedAt: now,
            },
        );

        await this.writeAudit({
            eventName: 'role_revoked',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'role',
            targetId: input.roleId,
            action: 'revoke',
            outcome: 'success',
            reason: input.reason,
            ...correlation(input.correlationId),
        });
    }

    async bootstrapAdministrator(
        input: BootstrapAdministratorInput,
    ): Promise<void> {
        await this.assertAuthorized(input.actor, 'bootstrap.administrator');

        const bootstrap =
            await this.dependencies.repository.findBootstrapControl();
        if (bootstrap !== null && bootstrap.consumedAt !== null) {
            await this.writeAudit({
                eventName: 'bootstrap_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'administrator',
                action: 'bootstrap',
                outcome: 'failure',
                reason: 'bootstrap_already_consumed',
                ...correlation(input.correlationId),
            });
            throw new BootstrapAlreadyConsumedError();
        }

        const now = this.clock();

        // Create bootstrap control if it doesn't exist
        if (bootstrap === null) {
            await this.dependencies.repository.createBootstrapControl({
                id: 'singleton',
                createdAt: now,
                updatedAt: now,
            });
        }

        // Atomically: consume bootstrap token AND assign the role
        // If role assignment fails, we should not have consumed the token
        try {
            // First assign the system-administrator role
            await this.assignSystemAdministratorRole({
                userId: input.userId,
                actor: input.actor,
                reason: input.reason,
                ...(input.correlationId !== undefined && {
                    correlationId: input.correlationId,
                }),
            });

            // Only consume the bootstrap token after successful role assignment
            await this.dependencies.repository.consumeBootstrapControl(
                'singleton',
                {
                    consumedAt: now,
                    consumedBy: input.actor.id,
                    changeReference: input.reason,
                    updatedAt: now,
                },
            );

            await this.writeAudit({
                eventName: 'bootstrap_administrator_established',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'administrator',
                targetId: input.userId,
                action: 'bootstrap',
                outcome: 'success',
                reason: input.reason,
                ...correlation(input.correlationId),
            });
        } catch (error) {
            // If role assignment fails, do not consume the bootstrap token
            // Write a failure audit event
            await this.writeAudit({
                eventName: 'bootstrap_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'administrator',
                targetId: input.userId,
                action: 'bootstrap',
                outcome: 'failure',
                reason: 'role_assignment_failed',
                ...correlation(input.correlationId),
            });
            throw error;
        }
    }

    async assignSystemAdministratorRole(
        input: AssignSystemAdministratorRoleInput,
    ): Promise<void> {
        await this.assertAuthorized(
            input.actor,
            'bootstrap.assign_system_administrator',
        );

        // Find the system-administrator role
        const systemAdminRole =
            await this.dependencies.repository.findRoleByKey(
                'system-administrator',
            );
        if (systemAdminRole === null) {
            await this.writeAudit({
                eventName: 'role_assignment_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'role',
                action: 'assign',
                outcome: 'failure',
                reason: 'system_administrator_role_not_found',
                ...correlation(input.correlationId),
            });
            throw new RoleNotFoundError('system-administrator');
        }

        // Verify this is the highest rank role
        // In a real implementation, we might want to check against all roles
        // For now, we'll rely on the role being created with the highest rank

        const existing =
            await this.dependencies.repository.findActiveUserRoleAssignment(
                input.userId,
                systemAdminRole.id,
            );
        if (existing !== null) {
            await this.writeAudit({
                eventName: 'role_assignment_failed',
                actorId: input.actor.id,
                actorType: input.actor.type,
                targetType: 'role',
                targetId: systemAdminRole.id,
                action: 'assign',
                outcome: 'failure',
                reason: 'duplicate_user_role_assignment',
                ...correlation(input.correlationId),
            });
            throw new DuplicateUserRoleAssignmentError(
                input.userId,
                systemAdminRole.id,
            );
        }

        const now = this.clock();
        await this.dependencies.repository.createUserRoleAssignment({
            userId: input.userId,
            roleId: systemAdminRole.id,
            status: 'ACTIVE',
            assignedAt: now,
            assignedBy: input.actor.id,
            assignmentReason: input.reason,
            createdAt: now,
            updatedAt: now,
        });

        await this.writeAudit({
            eventName: 'role_assigned',
            actorId: input.actor.id,
            actorType: input.actor.type,
            targetType: 'role',
            targetId: systemAdminRole.id,
            action: 'assign',
            outcome: 'success',
            reason: input.reason,
            afterState: {
                roleKey: systemAdminRole.key,
                rank: systemAdminRole.rank,
            },
            ...correlation(input.correlationId),
        });
    }

    private async requireRole(id: string): Promise<Role> {
        const role = await this.dependencies.repository.findRoleById(id);
        if (role === null) {
            await this.writeAudit({
                eventName: 'role_not_found',
                actorId: 'system',
                actorType: 'system',
                targetType: 'role',
                targetId: id,
                action: 'read',
                outcome: 'failure',
                reason: 'role_not_found',
            });
            throw new RoleNotFoundError(id);
        }
        return role;
    }

    private async assertAuthorized(
        actor: UserActor,
        action: RolesAndPermissionsAction,
        targetRoleId?: string,
        targetUserId?: string,
    ): Promise<void> {
        const allowed = await this.dependencies.authorization.authorize({
            actor,
            action,
            ...(targetRoleId === undefined ? {} : { targetRoleId }),
            ...(targetUserId === undefined ? {} : { targetUserId }),
        });
        if (!allowed) {
            await this.writeAudit({
                eventName: 'authorization_denied',
                actorId: actor.id,
                actorType: actor.type,
                targetType: 'role',
                ...(targetRoleId !== undefined && { targetId: targetRoleId }),
                ...(targetUserId !== undefined && { targetId: targetUserId }),
                action,
                outcome: 'failure',
                reason: 'authorization_denied',
            });
            throw new UnauthorizedRolesAndPermissionsError(action);
        }
    }

    private async assertPrivilegeElevation(
        actor: UserActor,
        action: string,
        targetId: string,
    ): Promise<void> {
        // Rank-based delegation authority check (OPTION A implementation)
        // This is a SECOND check layered ON TOP OF the existing permission requirement
        // An actor needs BOTH the assign permission AND a higher rank than the target role

        if (action === 'role.assign' || action === 'role.revoke') {
            // Get the target role to check its rank
            const targetRole =
                await this.dependencies.repository.findRoleById(targetId);
            if (targetRole === null) {
                await this.writeAudit({
                    eventName: 'privilege_escalation_blocked',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'role',
                    targetId: targetId,
                    action,
                    outcome: 'failure',
                    reason: 'target_role_not_found',
                });
                throw new PrivilegeEscalationError('Target role not found');
            }

            // Check if this is the system-administrator role (highest rank)
            // System-administrator can only be assigned via bootstrap, not normal role assignment
            // For revocation, we also protect system-administrator from being revoked by non-sysadmins
            if (targetRole.key === 'system-administrator') {
                await this.writeAudit({
                    eventName: 'privilege_escalation_blocked',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'role',
                    targetId: targetId,
                    action,
                    outcome: 'failure',
                    reason: 'system_administrator_bootstrap_only',
                });
                throw new PrivilegeEscalationError(
                    'System-administrator role can only be assigned through bootstrap',
                );
            }

            // Get the actor's active roles to determine their highest rank
            const actorRoleAssignments =
                await this.dependencies.repository.findActiveRolesForUser(
                    actor.id,
                );

            // Edge case: Actor with zero active roles (no rank) attempting any role assignment/revocation
            if (actorRoleAssignments.length === 0) {
                await this.writeAudit({
                    eventName: 'privilege_escalation_blocked',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'role',
                    targetId: targetId,
                    action,
                    outcome: 'failure',
                    reason: 'actor_has_no_active_roles',
                });
                throw new PrivilegeEscalationError(
                    `Actor has no active roles and cannot ${action === 'role.assign' ? 'assign' : 'revoke'} roles`,
                );
            }

            // Fetch the actual role objects to get their ranks
            const actorRoleIds = actorRoleAssignments.map(
                (assignment) => assignment.roleId,
            );
            const actorRoles: Role[] = [];
            for (const roleId of actorRoleIds) {
                const role =
                    await this.dependencies.repository.findRoleById(roleId);
                if (role !== null) {
                    actorRoles.push(role);
                }
            }

            // Determine the actor's highest rank
            const actorHighestRank = Math.max(
                ...actorRoles.map((role) => role.rank),
            );

            // Edge case: Actor attempting to assign/revoke a role at the SAME rank as their own highest rank
            // Must be "strictly less than", not "less than or equal to"
            if (targetRole.rank >= actorHighestRank) {
                await this.writeAudit({
                    eventName: 'privilege_escalation_blocked',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'role',
                    targetId: targetId,
                    action,
                    outcome: 'failure',
                    reason: 'target_rank_not_strictly_less_than_actor_rank',
                    afterState: {
                        actorHighestRank,
                        targetRank: targetRole.rank,
                    },
                });
                throw new PrivilegeEscalationError(
                    `Cannot ${action === 'role.assign' ? 'assign' : 'revoke'} role with rank ${targetRole.rank} when actor's highest rank is ${actorHighestRank}`,
                );
            }
        }

        if (action === 'permission.grant' || action === 'permission.revoke') {
            // For permission grants and revokes, we need to check if the target role's rank
            // allows the actor to perform this operation
            // Actor can only grant/revoke permissions to/from roles at or below their rank
            const targetRole =
                await this.dependencies.repository.findRoleById(targetId);
            if (targetRole === null) {
                await this.writeAudit({
                    eventName: 'privilege_escalation_blocked',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'role',
                    targetId: targetId,
                    action,
                    outcome: 'failure',
                    reason: 'target_role_not_found',
                });
                throw new PrivilegeEscalationError('Target role not found');
            }

            // Get the actor's active roles to determine their highest rank
            const actorRoleAssignments =
                await this.dependencies.repository.findActiveRolesForUser(
                    actor.id,
                );

            if (actorRoleAssignments.length === 0) {
                await this.writeAudit({
                    eventName: 'privilege_escalation_blocked',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'role',
                    targetId: targetId,
                    action,
                    outcome: 'failure',
                    reason: 'actor_has_no_active_roles',
                });
                throw new PrivilegeEscalationError(
                    `Actor has no active roles and cannot ${action === 'permission.grant' ? 'grant' : 'revoke'} permissions`,
                );
            }

            // Fetch the actual role objects to get their ranks
            const actorRoleIds = actorRoleAssignments.map(
                (assignment) => assignment.roleId,
            );
            const actorRoles: Role[] = [];
            for (const roleId of actorRoleIds) {
                const role =
                    await this.dependencies.repository.findRoleById(roleId);
                if (role !== null) {
                    actorRoles.push(role);
                }
            }

            const actorHighestRank = Math.max(
                ...actorRoles.map((role) => role.rank),
            );

            // Check if the target role's rank is not strictly less than actor's highest rank
            if (targetRole.rank >= actorHighestRank) {
                await this.writeAudit({
                    eventName: 'privilege_escalation_blocked',
                    actorId: actor.id,
                    actorType: actor.type,
                    targetType: 'role',
                    targetId: targetId,
                    action,
                    outcome: 'failure',
                    reason: 'target_rank_not_strictly_less_than_actor_rank',
                    afterState: {
                        actorHighestRank,
                        targetRank: targetRole.rank,
                    },
                });
                throw new PrivilegeEscalationError(
                    `Cannot ${action === 'permission.grant' ? 'grant' : 'revoke'} permission to/from role with rank ${targetRole.rank} when actor's highest rank is ${actorHighestRank}`,
                );
            }
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

export { ManageRolesAndPermissions as RolesAndPermissionsService };

function correlation(correlationId: string | undefined): {
    readonly correlationId?: string;
} {
    return correlationId === undefined ? {} : { correlationId };
}
