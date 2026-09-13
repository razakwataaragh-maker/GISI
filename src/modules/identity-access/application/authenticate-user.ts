import type {
    AuditEventInput,
    AuditWriter,
} from '../../audit/domain/audit-writer.js';
import {
    authenticationPrincipal,
    isActiveAccount,
} from '../domain/authentication.js';
import type {
    AuthenticateUserInput,
    AuthenticationResult,
    ProviderTokenVerifier,
    UserIdentityRepository,
} from '../contracts/authentication.js';

export interface AuthenticateUserDependencies {
    readonly tokenVerifier: ProviderTokenVerifier;
    readonly userRepository: UserIdentityRepository;
    readonly auditWriter: AuditWriter;
    readonly clock?: () => Date;
}

export class AuthenticateUser {
    private readonly clock: () => Date;

    constructor(private readonly dependencies: AuthenticateUserDependencies) {
        this.clock = dependencies.clock ?? (() => new Date());
    }

    authenticate(input: AuthenticateUserInput): Promise<AuthenticationResult> {
        return this.execute(input);
    }

    async execute(input: AuthenticateUserInput): Promise<AuthenticationResult> {
        const verification = await this.dependencies.tokenVerifier.verify(
            input.token,
        );

        if (!verification.ok) {
            const failure = {
                code:
                    verification.failure.code === 'DEPENDENCY_ERROR'
                        ? ('DEPENDENCY_ERROR' as const)
                        : ('UNAUTHORIZED' as const),
                reason: verification.failure.code,
            };
            return this.recordFailure(
                input.correlationId,
                'login_failure',
                failure,
            );
        }

        let user;
        try {
            user = await this.dependencies.userRepository.findByCognitoSubject(
                verification.identity.subject,
            );
        } catch {
            return this.recordFailure(input.correlationId, 'login_failure', {
                code: 'DEPENDENCY_ERROR',
                reason: 'USER_LOOKUP_FAILED',
            });
        }

        if (user === null) {
            return this.recordFailure(
                input.correlationId,
                'authentication_denied_unmapped_subject',
                {
                    code: 'UNAUTHORIZED',
                    reason: 'UNMAPPED_SUBJECT',
                },
            );
        }

        if (!isActiveAccount(user)) {
            return this.recordFailure(
                input.correlationId,
                'authentication_denied_inactive_account',
                {
                    code: 'FORBIDDEN',
                    reason: 'INACTIVE_ACCOUNT',
                },
                user.id,
            );
        }

        const context = {
            principal: authenticationPrincipal(user),
            assurance: 'cognito-verified' as const,
            authenticatedAt: this.clock(),
        };
        const correlation =
            input.correlationId === undefined
                ? {}
                : { correlationId: input.correlationId };
        const auditResult = await this.writeAudit({
            eventName: 'login_success',
            actorId: user.id,
            actorType: 'user',
            targetType: 'user',
            targetId: user.id,
            action: 'authenticate',
            outcome: 'success',
            ...correlation,
        });

        if (!auditResult) {
            return {
                ok: false,
                failure: {
                    code: 'DEPENDENCY_ERROR',
                    reason: 'AUDIT_WRITE_FAILED',
                },
            };
        }

        return { ok: true, context };
    }

    private async recordFailure(
        correlationId: string | undefined,
        eventName:
            | 'login_failure'
            | 'authentication_denied_unmapped_subject'
            | 'authentication_denied_inactive_account',
        failure: {
            readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'DEPENDENCY_ERROR';
            readonly reason:
                | 'MALFORMED_TOKEN'
                | 'INVALID_SIGNATURE'
                | 'EXPIRED_TOKEN'
                | 'WRONG_ISSUER'
                | 'WRONG_AUDIENCE'
                | 'INVALID_TOKEN_USE'
                | 'INVALID_CLAIMS'
                | 'DEPENDENCY_ERROR'
                | 'UNMAPPED_SUBJECT'
                | 'INACTIVE_ACCOUNT'
                | 'USER_LOOKUP_FAILED';
        },
        targetId?: string,
    ): Promise<AuthenticationResult> {
        const correlation =
            correlationId === undefined ? {} : { correlationId };
        const auditResult = await this.writeAudit({
            eventName,
            actorType: 'anonymous',
            targetType: targetId === undefined ? 'authentication' : 'user',
            ...(targetId === undefined ? {} : { targetId }),
            action: 'authenticate',
            outcome: 'failure',
            ...correlation,
            reason: failure.reason,
        });

        if (!auditResult) {
            return {
                ok: false,
                failure: {
                    code: 'DEPENDENCY_ERROR',
                    reason: 'AUDIT_WRITE_FAILED',
                },
            };
        }

        return { ok: false, failure };
    }

    private async writeAudit(
        event: Omit<
            AuditEventInput,
            'category' | 'owningModule' | 'sourceBoundary'
        >,
    ): Promise<boolean> {
        try {
            await this.dependencies.auditWriter.append({
                ...event,
                category: 'security',
                owningModule: 'identity-access',
                sourceBoundary: 'application',
            });
            return true;
        } catch {
            return false;
        }
    }
}

export { AuthenticateUser as AuthenticationService };
