import { describe, expect, it } from 'vitest';
import {
    isActiveAccount,
    authenticationPrincipal,
    isInactiveAccountStatus,
} from '../../src/modules/identity-access/domain/authentication.js';

describe('Authentication Domain', () => {
    describe('isActiveAccount', () => {
        it('returns true for ACTIVE status', () => {
            const user = {
                id: 'user-1',
                cognitoSubject: 'cognito-1',
                status: 'ACTIVE' as const,
            };
            expect(isActiveAccount(user)).toBe(true);
        });

        it('returns false for DEACTIVATED status', () => {
            const user = {
                id: 'user-1',
                cognitoSubject: 'cognito-1',
                status: 'DEACTIVATED' as const,
            };
            expect(isActiveAccount(user)).toBe(false);
        });

        it('returns false for SUSPENDED status', () => {
            const user = {
                id: 'user-1',
                cognitoSubject: 'cognito-1',
                status: 'SUSPENDED' as const,
            };
            expect(isActiveAccount(user)).toBe(false);
        });
    });

    describe('authenticationPrincipal', () => {
        it('creates principal from user', () => {
            const user = {
                id: 'user-1',
                cognitoSubject: 'cognito-1',
                status: 'ACTIVE' as const,
            };
            const principal = authenticationPrincipal(user);
            expect(principal.userId).toBe(user.id);
            expect(principal.cognitoSubject).toBe(user.cognitoSubject);
            expect(principal.actorType).toBe('user');
        });
    });

    describe('isInactiveAccountStatus', () => {
        it('returns true for DEACTIVATED status', () => {
            expect(isInactiveAccountStatus('DEACTIVATED')).toBe(true);
        });

        it('returns true for SUSPENDED status', () => {
            expect(isInactiveAccountStatus('SUSPENDED')).toBe(true);
        });

        it('returns false for ACTIVE status', () => {
            expect(isInactiveAccountStatus('ACTIVE')).toBe(false);
        });
    });
});
