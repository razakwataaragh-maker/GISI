import type { UserIdentityRepository } from '../contracts/authentication.js';
import type {
    ManagedUser,
    UserManagementRepository,
} from '../contracts/user-management.js';
import { DuplicateCognitoSubjectError } from '../domain/user-management.js';

interface UserRecord extends ManagedUser {
    readonly id: string;
    readonly cognitoSubject: string;
    readonly status: 'ACTIVE' | 'DEACTIVATED' | 'SUSPENDED';
}

interface UserStore {
    readonly user: {
        findUnique(args: {
            readonly where:
                { readonly cognitoSubject: string } | { readonly id: string };
            readonly select: UserSelect;
        }): Promise<UserRecord | null>;
        create(args: {
            readonly data: Record<string, unknown>;
        }): Promise<UserRecord>;
        update(args: {
            readonly where: { readonly id: string };
            readonly data: Record<string, unknown>;
            readonly select: UserSelect;
        }): Promise<UserRecord>;
    };
}

interface UserSelect {
    readonly id: true;
    readonly cognitoSubject: true;
    readonly status: true;
    readonly createdAt: true;
    readonly updatedAt: true;
    readonly activatedAt: true;
    readonly deactivatedAt: true;
    readonly suspendedAt: true;
    readonly statusChangedAt: true;
    readonly statusChangedBy: true;
    readonly statusChangeReason: true;
}

const userSelect: UserSelect = {
    id: true,
    cognitoSubject: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    activatedAt: true,
    deactivatedAt: true,
    suspendedAt: true,
    statusChangedAt: true,
    statusChangedBy: true,
    statusChangeReason: true,
};

export class PrismaUserIdentityRepository
    implements UserIdentityRepository, UserManagementRepository
{
    constructor(private readonly store: UserStore) {}

    async findByCognitoSubject(subject: string): Promise<ManagedUser | null> {
        return this.store.user.findUnique({
            where: { cognitoSubject: subject },
            select: userSelect,
        });
    }

    async findById(id: string): Promise<ManagedUser | null> {
        return this.store.user.findUnique({
            where: { id },
            select: userSelect,
        });
    }

    async create(input: {
        readonly id?: string;
        readonly cognitoSubject: string;
        readonly status: ManagedUser['status'];
        readonly createdAt: Date;
        readonly updatedAt: Date;
        readonly activatedAt: Date | null;
        readonly deactivatedAt: Date | null;
        readonly suspendedAt: Date | null;
        readonly statusChangedAt: Date;
        readonly statusChangedBy: string;
        readonly statusChangeReason: string;
    }): Promise<ManagedUser> {
        try {
            return await this.store.user.create({
                data: {
                    ...(input.id === undefined ? {} : { id: input.id }),
                    cognitoSubject: input.cognitoSubject,
                    status: input.status,
                    createdAt: input.createdAt,
                    updatedAt: input.updatedAt,
                    activatedAt: input.activatedAt,
                    deactivatedAt: input.deactivatedAt,
                    suspendedAt: input.suspendedAt,
                    statusChangedAt: input.statusChangedAt,
                    statusChangedBy: input.statusChangedBy,
                    statusChangeReason: input.statusChangeReason,
                },
            });
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new DuplicateCognitoSubjectError();
            }
            throw error;
        }
    }

    async update(
        id: string,
        fields: {
            readonly status: ManagedUser['status'];
            readonly updatedAt: Date;
            readonly activatedAt: Date | null;
            readonly deactivatedAt: Date | null;
            readonly suspendedAt: Date | null;
            readonly statusChangedAt: Date;
            readonly statusChangedBy: string;
            readonly statusChangeReason: string;
        },
    ): Promise<ManagedUser> {
        return this.store.user.update({
            where: { id },
            data: fields,
            select: userSelect,
        });
    }

    async updateApprovedFields(
        id: string,
        fields: { readonly statusChangeReason?: string },
        updatedAt: Date,
    ): Promise<ManagedUser> {
        return this.store.user.update({
            where: { id },
            data: { ...fields, updatedAt },
            select: userSelect,
        });
    }
}

export { PrismaUserIdentityRepository as PrismaUserRepository };

function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
    );
}
