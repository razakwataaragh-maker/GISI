import type {
    MappedUser,
    UserIdentityRepository,
} from '../contracts/authentication.js';

interface UserRecord {
    readonly id: string;
    readonly cognitoSubject: string;
    readonly status: 'ACTIVE' | 'DEACTIVATED' | 'SUSPENDED';
}

interface UserStore {
    readonly user: {
        findUnique(args: {
            readonly where: { readonly cognitoSubject: string };
            readonly select: {
                readonly id: true;
                readonly cognitoSubject: true;
                readonly status: true;
            };
        }): Promise<UserRecord | null>;
    };
}

export class PrismaUserIdentityRepository implements UserIdentityRepository {
    constructor(private readonly store: UserStore) {}

    async findByCognitoSubject(subject: string): Promise<MappedUser | null> {
        return this.store.user.findUnique({
            where: { cognitoSubject: subject },
            select: {
                id: true,
                cognitoSubject: true,
                status: true,
            },
        });
    }
}

export { PrismaUserIdentityRepository as PrismaUserRepository };
