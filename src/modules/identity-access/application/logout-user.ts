import type {
    AuditEventInput,
    AuditWriter,
} from '../../audit/domain/audit-writer.js';
import type { AuthenticationPrincipal } from '../contracts/authentication.js';

export interface LogoutUserInput {
    readonly principal: AuthenticationPrincipal;
    readonly correlationId?: string;
}

export type LogoutResult =
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

export interface LogoutUserDependencies {
    readonly auditWriter: AuditWriter;
}

export class LogoutUser {
    async execute(input: LogoutUserInput): Promise<LogoutResult> {
        const correlation =
            input.correlationId === undefined
                ? {}
                : { correlationId: input.correlationId };

        const auditResult = await this.writeAudit({
            eventName: 'logout_success',
            actorId: input.principal.userId,
            actorType: 'user',
            targetType: 'user',
            targetId: input.principal.userId,
            action: 'logout',
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

    constructor(private readonly dependencies: LogoutUserDependencies) {}
}

export { LogoutUser as LogoutService };
