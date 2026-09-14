import type {
    AuthorizationInput,
    AuthorizationResult,
    AuthorizationService as AuthorizationServiceContract,
    RolesAndPermissionsRepository,
} from '../contracts/roles-and-permissions.js';
import { validatePermissionId } from '../contracts/permissions.js';

export interface AuthorizationServiceDependencies {
    readonly repository: RolesAndPermissionsRepository;
}

export class AuthorizationService implements AuthorizationServiceContract {
    constructor(
        private readonly dependencies: AuthorizationServiceDependencies,
    ) {}

    async authorize(input: AuthorizationInput): Promise<AuthorizationResult> {
        // Step 1: Validate the permission exists in the registry
        if (!validatePermissionId(input.action)) {
            return {
                allowed: false,
                reason: 'permission_not_found',
            };
        }

        // Step 2: Check if actor has any active roles
        const activeRoles =
            await this.dependencies.repository.findActiveRolesForUser(
                input.actor.id,
            );

        if (activeRoles.length === 0) {
            return {
                allowed: false,
                reason: 'no_active_roles',
            };
        }

        // Step 3: Check if any active role has the required permission
        for (const roleAssignment of activeRoles) {
            const rolePermissions =
                await this.dependencies.repository.findActivePermissionsForRole(
                    roleAssignment.roleId,
                );

            const hasPermission = rolePermissions.some(
                (rp) => rp.permissionId === input.action,
            );

            if (hasPermission) {
                // Step 4: Evaluate resource context if provided
                // For now, we'll implement a basic check - in a full implementation,
                // this would evaluate the specific resource context rules
                const contextValid = this.evaluateResourceContext();

                if (contextValid) {
                    return { allowed: true };
                }
            }
        }

        // Step 5: Deny by default
        return {
            allowed: false,
            reason: 'permission_denied',
        };
    }

    private evaluateResourceContext(): boolean {
        // Simplified resource context evaluation
        // In a full implementation, this would evaluate specific context rules
        // For now, we'll return true if no context is provided (no restrictions)
        // or implement basic checks as needed
        return true;
    }
}
