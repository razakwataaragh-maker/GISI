import { describe, expect, it } from 'vitest';
import {
    PrivilegeEscalationError,
    DuplicateRoleKeyError,
    DuplicateRolePermissionError,
    DuplicateUserRoleAssignmentError,
    RolePermissionNotAssignedError,
    UserRoleAssignmentNotActiveError,
    InvalidRoleStatusError,
    PermissionNotFoundError,
    BootstrapAlreadyConsumedError,
} from '../../src/modules/identity-access/domain/roles-and-permissions.js';

describe('Roles and Permissions Domain', () => {
    describe('PrivilegeEscalationError', () => {
        it('creates error with message', () => {
            const error = new PrivilegeEscalationError('user.read', 'role-1');
            expect(error.message).toContain('Privilege escalation');
            expect(error.code).toBe('PRIVILEGE_ESCALATION');
        });
    });

    describe('DuplicateRoleKeyError', () => {
        it('creates error with role key', () => {
            const error = new DuplicateRoleKeyError('admin');
            expect(error.message).toContain('admin');
            expect(error.code).toBe('DUPLICATE_ROLE_KEY');
        });
    });

    describe('DuplicateRolePermissionError', () => {
        it('creates error with role and permission', () => {
            const error = new DuplicateRolePermissionError('role-1', 'user.read');
            expect(error.message).toContain('role-1');
            expect(error.message).toContain('user.read');
            expect(error.code).toBe('DUPLICATE_ROLE_PERMISSION');
        });
    });

    describe('DuplicateUserRoleAssignmentError', () => {
        it('creates error with user and role', () => {
            const error = new DuplicateUserRoleAssignmentError('user-1', 'role-1');
            expect(error.message).toContain('user-1');
            expect(error.message).toContain('role-1');
            expect(error.code).toBe('DUPLICATE_USER_ROLE_ASSIGNMENT');
        });
    });

    describe('RolePermissionNotAssignedError', () => {
        it('creates error with role and permission', () => {
            const error = new RolePermissionNotAssignedError('role-1', 'user.read');
            expect(error.message).toContain('role-1');
            expect(error.message).toContain('user.read');
            expect(error.code).toBe('ROLE_PERMISSION_NOT_ASSIGNED');
        });
    });

    describe('UserRoleAssignmentNotActiveError', () => {
        it('creates error with user and role', () => {
            const error = new UserRoleAssignmentNotActiveError('user-1', 'role-1');
            expect(error.message).toContain('user-1');
            expect(error.message).toContain('role-1');
            expect(error.code).toBe('USER_ROLE_ASSIGNMENT_NOT_ACTIVE');
        });
    });

    describe('InvalidRoleStatusError', () => {
        it('creates error with status and action', () => {
            const error = new InvalidRoleStatusError('INACTIVE', 'deactivate');
            expect(error.message).toContain('INACTIVE');
            expect(error.message).toContain('deactivate');
            expect(error.code).toBe('INVALID_ROLE_STATUS');
        });
    });

    describe('PermissionNotFoundError', () => {
        it('creates error with permission ID', () => {
            const error = new PermissionNotFoundError('invalid.permission');
            expect(error.message).toContain('invalid.permission');
            expect(error.code).toBe('PERMISSION_NOT_FOUND');
        });
    });

    describe('BootstrapAlreadyConsumedError', () => {
        it('creates error for consumed bootstrap', () => {
            const error = new BootstrapAlreadyConsumedError();
            expect(error.message).toContain('Bootstrap');
            expect(error.code).toBe('BOOTSTRAP_ALREADY_CONSUMED');
        });
    });
});
