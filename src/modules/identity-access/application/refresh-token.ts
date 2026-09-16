import type {
    AuditEventInput,
    AuditWriter,
} from '../../audit/domain/audit-writer.js';
import type {
    AuthenticationContext,
    AuthenticationPrincipal,
    ProviderTokenVerifier,
    UserIdentityRepository,
} from '../contracts/authentication.js';

export interface RefreshTokenInput {
    readonly refreshToken: string;
    readonly correlationId?: string;
}

export type RefreshTokenResult =
    | {
          readonly ok: true;
          readonly context: AuthenticationContext;
      }
    | {
          readonly ok: false;
          readonly failure: {
              readonly code: 'UNAUTHORIZED' | 'DEPENDENCY_ERROR';
              readonly reason:
                  | 'INVALID_REFRESH_TOKEN'
                  | 'EXPIRED_REFRESH_TOKEN'
                  | 'USER_LOOKUP_FAILED'
                  | 'INACTIVE_ACCOUNT'
                  | 'AUDIT_WRITE_FAILED';
          };
      };

export interface RefreshTokenDependencies {
    readonly tokenVerifier: ProviderTokenVerifier;
    readonly userRepository: UserIdentityRepository;
    readonly auditWriter: AuditWriter;
    readonly clock?: () => Date;
}

export class RefreshToken {
    private readonly clock: () => Date;

    constructor(private readonly dependencies: RefreshTokenDependencies) {
        this.clock = dependencies.clock ?? (() => new Date());
    }

    async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
        // Verify the refresh token
        const verification = await this.dependencies.tokenVerifier.verify(
            input.refreshToken,
        );

        if (!verification.ok) {
            const failure = {
                code:
                    verification.failure.code === 'EXPIRED_TOKEN'
                        ? ('UNAUTHORIZED' as const)
                        : ('UNAUTHORIZED' as const),
                reason:
                    verification.failure.code === 'EXPIRED_TOKEN'
                        ? ('EXPIRED_REFRESH_TOKEN' as const)
                        : ('INVALID_REFRESH_TOKEN' as const),
            };
            return this.recordFailure(
                input.correlationId,
                'token_refresh_failure',
                failure,
            );
        }

        // Look up the user
        let user;
        try {
            user = await this.dependencies.userRepository.findByCognitoSubject(
                verification.identity.subject,
            );
        } catch {
            return this.recordFailure(input.correlationId, 'token_refresh_failure', {
                code: 'DEPENDENCY_ERROR',
                reason: 'USER_LOOKUP_FAILED',
            });
        }

        if (user === null) {
            return this.recordFailure(
                input.correlationId,
                'token_refresh_denied_unmapped_subject',
                {
                    code: 'UNAUTHORIZED',
                    reason: 'INVALID_REFRESH_TOKEN',
                },
            );
        }

        if (user.status !== 'ACTIVE') {
            return this.recordFailure(
                input.correlationId,
                'token_refresh_denied_inactive_account',
                {
                    code: 'UNAUTHORIZED',
                    reason: 'INACTIVE_ACCOUNT',
                },
                user.id,
            );
        }

        // Create new authentication context
        const context = {
            principal: {
                userId: user.id,
                cognitoSubject: user.cognitoSubject,
                actorType: 'user' as const,
            },
            assurance: 'cognito-verified' as const,
            authenticatedAt: this.clock(),
        };

        // Record successful token refresh
        const correlation =
            input.correlationId === undefined
                ? {}
                : { correlationId: input.correlationId };
        const auditResult = await this.writeAudit({
            eventName: 'token_refresh_success',
            actorId: user.id,
            actorType: 'user',
            targetType: 'user',
            targetId: user.id,
            action: 'refresh_token',
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
            | 'token_refresh_failure'
            | 'token_refresh_denied_unmapped_subject'
            | 'token_refresh_denied_inactive_account',
        failure: {
            readonly code: 'UNAUTHORIZED' | 'DEPENDENCY_ERROR';
            readonly reason:
                | 'INVALID_REFRESH_TOKEN'
                | 'EXPIRED_REFRESH_TOKEN'
                | 'USER_LOOKUP_FAILED'
                | 'INACTIVE_ACCOUNT';
        },
        targetId?: string,
    ): Promise<RefreshTokenResult> {
        const correlation =
            correlationId === undefined ? {} : { correlationId };
        const auditResult = await this.writeAudit({
            eventName,
            actorType: 'anonymous',
            targetType: targetId === undefined ? 'authentication' : 'user',
            ...(targetId === undefined ? {} : { targetId }),
            action: 'refresh_token',
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

export { RefreshToken as TokenRefreshService };
