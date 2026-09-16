import type {
    BootstrapControl,
    PermissionReference,
    Role,
    RolePermission,
    RolesAndPermissionsRepository,
    UserRoleAssignment,
} from '../contracts/roles-and-permissions.js';

interface RoleRecord extends Role {
    readonly id: string;
    readonly key: string;
    readonly name: string;
    readonly description: string | null;
    readonly status: 'ACTIVE' | 'INACTIVE';
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

interface PermissionRecord extends PermissionReference {
    readonly id: string;
}

interface RolePermissionRecord extends RolePermission {
    readonly id: string;
    readonly roleId: string;
    readonly permissionId: string;
    readonly status: 'ACTIVE' | 'REVOKED';
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

interface UserRoleAssignmentRecord extends UserRoleAssignment {
    readonly id: string;
    readonly userId: string;
    readonly roleId: string;
    readonly status: 'ACTIVE' | 'REVOKED';
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

interface Store {
    readonly role: {
        findUnique(args: {
            readonly where: { readonly id: string } | { readonly key: string };
            readonly select: RoleSelect;
        }): Promise<RoleRecord | null>;
        create(args: {
            readonly data: Record<string, unknown>;
        }): Promise<RoleRecord>;
        update(args: {
            readonly where: { readonly id: string };
            readonly data: Record<string, unknown>;
            readonly select: RoleSelect;
        }): Promise<RoleRecord>;
    };
    readonly permissionReference: {
        findUnique(args: {
            readonly where: { readonly id: string };
        }): Promise<PermissionRecord | null>;
        create(args: {
            readonly data: Record<string, unknown>;
        }): Promise<PermissionRecord>;
    };
    readonly rolePermission: {
        findUnique(args: {
            readonly where: {
                readonly roleId_permissionId_status: {
                    readonly roleId: string;
                    readonly permissionId: string;
                    readonly status: 'ACTIVE';
                };
            };
        }): Promise<RolePermissionRecord | null>;
        findMany(args: {
            readonly where: {
                readonly roleId: string;
                readonly status: 'ACTIVE';
            };
        }): Promise<RolePermissionRecord[]>;
        create(args: {
            readonly data: Record<string, unknown>;
        }): Promise<RolePermissionRecord>;
        update(args: {
            readonly where: { readonly id: string };
            readonly data: Record<string, unknown>;
        }): Promise<RolePermissionRecord>;
    };
    readonly userRoleAssignment: {
        findUnique(args: {
            readonly where: {
                readonly userId_roleId_status: {
                    readonly userId: string;
                    readonly roleId: string;
                    readonly status: 'ACTIVE';
                };
            };
        }): Promise<UserRoleAssignmentRecord | null>;
        findMany(args: {
            readonly where: {
                readonly userId: string;
                readonly status: 'ACTIVE';
            };
        }): Promise<UserRoleAssignmentRecord[]>;
        create(args: {
            readonly data: Record<string, unknown>;
        }): Promise<UserRoleAssignmentRecord>;
        update(args: {
            readonly where: { readonly id: string };
            readonly data: Record<string, unknown>;
        }): Promise<UserRoleAssignmentRecord>;
    };
    readonly bootstrapControl: {
        findUnique(args: {
            readonly where: { readonly id: string };
        }): Promise<{ id: string; consumedAt: Date | null } | null>;
        create(args: {
            readonly data: Record<string, unknown>;
        }): Promise<{ id: string; consumedAt: Date | null }>;
        update(args: {
            readonly where: { readonly id: string };
            readonly data: Record<string, unknown>;
        }): Promise<void>;
    };
}

interface RoleSelect {
    readonly id: true;
    readonly key: true;
    readonly name: true;
    readonly description: true;
    readonly status: true;
    readonly rank: true;
    readonly createdAt: true;
    readonly updatedAt: true;
    readonly createdBy: true;
    readonly updatedBy: true;
    readonly deactivatedAt: true;
    readonly deactivatedBy: true;
    readonly deactivationReason: true;
    readonly changeReference: true;
}

const roleSelect: RoleSelect = {
    id: true,
    key: true,
    name: true,
    description: true,
    status: true,
    rank: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    updatedBy: true,
    deactivatedAt: true,
    deactivatedBy: true,
    deactivationReason: true,
    changeReference: true,
};

export class PrismaRolesRepository implements RolesAndPermissionsRepository {
    constructor(private readonly store: Store) {}

    async findRoleById(id: string): Promise<Role | null> {
        return this.store.role.findUnique({
            where: { id },
            select: roleSelect,
        });
    }

    async findRoleByKey(key: string): Promise<Role | null> {
        return this.store.role.findUnique({
            where: { key },
            select: roleSelect,
        });
    }

    async createRole(input: {
        readonly id?: string;
        readonly key: string;
        readonly name: string;
        readonly description: string | null;
        readonly status: 'ACTIVE' | 'INACTIVE';
        readonly rank: number;
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly createdBy: string;
        readonly updatedBy: string;
    }): Promise<Role> {
        return this.store.role.create({
            data: {
                ...(input.id === undefined ? {} : { id: input.id }),
                key: input.key,
                name: input.name,
                description: input.description,
                status: input.status,
                rank: input.rank,
                createdAt: input.createdAt,
                updatedAt: input.updatedAt,
                createdBy: input.createdBy,
                updatedBy: input.updatedBy,
            },
        });
    }

    async updateRole(
        id: string,
        fields: {
            readonly name?: string;
            readonly description?: string;
            readonly updatedAt: Date;
            readonly updatedBy: string;
        },
    ): Promise<Role> {
        return this.store.role.update({
            where: { id },
            data: fields,
            select: roleSelect,
        });
    }

    async deactivateRole(
        id: string,
        fields: {
            readonly status: 'ACTIVE' | 'INACTIVE';
            readonly updatedAt: Date;
            readonly deactivatedAt: Date;
            readonly deactivatedBy: string;
            readonly deactivationReason: string;
        },
    ): Promise<Role> {
        return this.store.role.update({
            where: { id },
            data: fields,
            select: roleSelect,
        });
    }

    async findPermissionById(id: string): Promise<PermissionReference | null> {
        return this.store.permissionReference.findUnique({
            where: { id },
        });
    }

    async createPermission(input: {
        readonly id: string;
    }): Promise<PermissionReference> {
        return this.store.permissionReference.create({
            data: { id: input.id },
        });
    }

    async findActiveRolePermission(
        roleId: string,
        permissionId: string,
    ): Promise<RolePermission | null> {
        return this.store.rolePermission.findUnique({
            where: {
                roleId_permissionId_status: {
                    roleId,
                    permissionId,
                    status: 'ACTIVE',
                },
            },
        });
    }

    async createRolePermission(input: {
        readonly id?: string;
        readonly roleId: string;
        readonly permissionId: string;
        readonly status: 'ACTIVE' | 'REVOKED';
        readonly assignedAt: Date;
        readonly assignedBy: string;
        readonly assignmentReason: string;
        readonly createdAt: Date;
        readonly updatedAt: Date;
    }): Promise<RolePermission> {
        return this.store.rolePermission.create({
            data: {
                ...(input.id === undefined ? {} : { id: input.id }),
                roleId: input.roleId,
                permissionId: input.permissionId,
                status: input.status,
                assignedAt: input.assignedAt,
                assignedBy: input.assignedBy,
                assignmentReason: input.assignmentReason,
                createdAt: input.createdAt,
                updatedAt: input.updatedAt,
            },
        });
    }

    async revokeRolePermission(
        id: string,
        fields: {
            readonly status: 'ACTIVE' | 'REVOKED';
            readonly revokedAt: Date;
            readonly revokedBy: string;
            readonly revocationReason: string;
            readonly updatedAt: Date;
        },
    ): Promise<RolePermission> {
        return this.store.rolePermission.update({
            where: { id },
            data: fields,
        });
    }

    async findActivePermissionsForRole(
        roleId: string,
    ): Promise<RolePermission[]> {
        return this.store.rolePermission.findMany({
            where: { roleId, status: 'ACTIVE' },
        });
    }

    async findActiveUserRoleAssignment(
        userId: string,
        roleId: string,
    ): Promise<UserRoleAssignment | null> {
        return this.store.userRoleAssignment.findUnique({
            where: {
                userId_roleId_status: {
                    userId,
                    roleId,
                    status: 'ACTIVE',
                },
            },
        });
    }

    async createUserRoleAssignment(input: {
        readonly id?: string;
        readonly userId: string;
        readonly roleId: string;
        readonly status: 'ACTIVE' | 'REVOKED';
        readonly assignedAt: Date;
        readonly assignedBy: string;
        readonly assignmentReason: string;
        readonly createdAt: Date;
        readonly updatedAt: Date;
    }): Promise<UserRoleAssignment> {
        return this.store.userRoleAssignment.create({
            data: {
                ...(input.id === undefined ? {} : { id: input.id }),
                userId: input.userId,
                roleId: input.roleId,
                status: input.status,
                assignedAt: input.assignedAt,
                assignedBy: input.assignedBy,
                assignmentReason: input.assignmentReason,
                createdAt: input.createdAt,
                updatedAt: input.updatedAt,
            },
        });
    }

    async revokeUserRoleAssignment(
        id: string,
        fields: {
            readonly status: 'ACTIVE' | 'REVOKED';
            readonly revokedAt: Date;
            readonly revokedBy: string;
            readonly revocationReason: string;
            readonly updatedAt: Date;
        },
    ): Promise<UserRoleAssignment> {
        return this.store.userRoleAssignment.update({
            where: { id },
            data: fields,
        });
    }

    async findActiveRolesForUser(
        userId: string,
    ): Promise<UserRoleAssignment[]> {
        return this.store.userRoleAssignment.findMany({
            where: { userId, status: 'ACTIVE' },
        });
    }

    async findBootstrapControl(): Promise<{
        id: string;
        consumedAt: Date | null;
    } | null> {
        const result = await this.store.bootstrapControl.findUnique({
            where: { id: 'singleton' },
        });
        if (result === null) return null;
        return { id: result.id, consumedAt: result.consumedAt };
    }

    async createBootstrapControl(input: {
        readonly id: string;
        readonly createdAt: Date;
        readonly updatedAt: Date;
    }): Promise<BootstrapControl> {
        const created = await this.store.bootstrapControl.create({
            data: input,
        });
        return created as BootstrapControl;
    }

    async consumeBootstrapControl(
        id: string,
        fields: {
            readonly consumedAt: Date;
            readonly consumedBy: string;
            readonly changeReference: string;
            readonly updatedAt: Date;
        },
    ): Promise<void> {
        await this.store.bootstrapControl.update({
            where: { id },
            data: fields,
        });
    }
}
