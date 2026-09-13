export type AccountStatus = 'ACTIVE' | 'DEACTIVATED' | 'SUSPENDED';

export interface MappedUser {
    readonly id: string;
    readonly cognitoSubject: string;
    readonly status: AccountStatus;
}

export interface VerifiedProviderIdentity {
    readonly subject: string;
    readonly tokenUse: 'id' | 'access';
}

export const providerVerificationFailureCodes = [
    'MALFORMED_TOKEN',
    'INVALID_SIGNATURE',
    'EXPIRED_TOKEN',
    'WRONG_ISSUER',
    'WRONG_AUDIENCE',
    'INVALID_TOKEN_USE',
    'INVALID_CLAIMS',
    'DEPENDENCY_ERROR',
] as const;

export type ProviderVerificationFailureCode =
    (typeof providerVerificationFailureCodes)[number];

export interface ProviderVerificationFailure {
    readonly code: ProviderVerificationFailureCode;
}

export type ProviderVerificationResult =
    | {
          readonly ok: true;
          readonly identity: VerifiedProviderIdentity;
      }
    | {
          readonly ok: false;
          readonly failure: ProviderVerificationFailure;
      };

export interface ProviderTokenVerifier {
    verify(token: string): Promise<ProviderVerificationResult>;
}

export interface UserIdentityRepository {
    findByCognitoSubject(subject: string): Promise<MappedUser | null>;
}

export type AuthenticationFailureCode =
    'UNAUTHORIZED' | 'FORBIDDEN' | 'DEPENDENCY_ERROR';

export type AuthenticationFailureReason =
    | ProviderVerificationFailureCode
    | 'UNMAPPED_SUBJECT'
    | 'INACTIVE_ACCOUNT'
    | 'USER_LOOKUP_FAILED'
    | 'AUDIT_WRITE_FAILED';

export interface AuthenticationFailure {
    readonly code: AuthenticationFailureCode;
    readonly reason: AuthenticationFailureReason;
}

export interface AuthenticationPrincipal {
    readonly userId: string;
    readonly cognitoSubject: string;
    readonly actorType: 'user';
}

export interface AuthenticationContext {
    readonly principal: AuthenticationPrincipal;
    readonly assurance: 'cognito-verified';
    readonly authenticatedAt: Date;
}

export type AuthenticationResult =
    | {
          readonly ok: true;
          readonly context: AuthenticationContext;
      }
    | {
          readonly ok: false;
          readonly failure: AuthenticationFailure;
      };

export interface AuthenticateUserInput {
    readonly token: string;
    readonly correlationId?: string;
}
