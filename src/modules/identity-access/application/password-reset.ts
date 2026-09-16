import type {
    AuditEventInput,
    AuditWriter,
} from '../../audit/domain/audit-writer.js';

export interface ForgotPasswordInput {
    readonly email: string;
    readonly correlationId?: string;
}

export type ForgotPasswordResult =
    | {
          readonly ok: true;
      }
    | {
          readonly ok: false;
          readonly failure: {
              readonly code: 'DEPENDENCY_ERROR';
              readonly reason: 'AUDIT_WRITE_FAILED';
          };
      };

export interface ResetPasswordInput {
    readonly token: string;
    readonly newPassword: string;
    readonly correlationId?: string;
}

export type ResetPasswordResult =
    | {
          readonly ok: true;
      }
    | {
          readonly ok: false;
          readonly failure: {
              readonly code: 'DEPENDENCY_ERROR';
              readonly reason: 'AUDIT_WRITE_FAILED';
          };
      };

export interface PasswordResetDependencies {
    readonly auditWriter: AuditWriter;
}

export class PasswordReset {
    async forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
        const correlation =
            input.correlationId === undefined
                ? {}
                : { correlationId: input.correlationId };

        const auditResult = await this.writeAudit({
            eventName: 'password_reset_requested',
            actorType: 'anonymous',
            targetType: 'user',
            targetId: input.email, // Use email as identifier since user ID unknown
            action: 'request_password_reset',
            outcome: 'success',
            ...correlation,
            reason: 'Password reset requested via email',
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

        return { ok: true };
    }

    async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
        const correlation =
            input.correlationId === undefined
                ? {}
                : { correlationId: input.correlationId };

        const auditResult = await this.writeAudit({
            eventName: 'password_reset_completed',
            actorType: 'anonymous',
            targetType: 'authentication',
            action: 'reset_password',
            outcome: 'success',
            ...correlation,
            reason: 'Password reset completed with token',
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

        return { ok: true };
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

    constructor(private readonly dependencies: PasswordResetDependencies) {}
}

export { PasswordReset as PasswordResetService };
