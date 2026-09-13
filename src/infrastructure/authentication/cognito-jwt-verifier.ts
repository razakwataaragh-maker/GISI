import { decodeProtectedHeader, importJWK, jwtVerify, type JWK } from 'jose';
import type { CognitoConfiguration } from './cognito-configuration.js';
import type {
    ProviderTokenVerifier,
    ProviderVerificationFailureCode,
    ProviderVerificationResult,
} from '../../modules/identity-access/contracts/authentication.js';

interface JwksDocument {
    readonly keys: readonly JWK[];
}

export interface CognitoJwtVerifierOptions {
    readonly fetcher?: typeof fetch;
    readonly cacheTtlMs?: number;
    readonly clockToleranceSeconds?: number;
    readonly now?: () => number;
}

const defaultCacheTtlMs = 15 * 60 * 1000;
const defaultClockToleranceSeconds = 5;
type VerificationKey = Awaited<ReturnType<typeof importJWK>>;

export class CognitoJwtVerifier implements ProviderTokenVerifier {
    private readonly fetcher: typeof fetch;
    private readonly cacheTtlMs: number;
    private readonly clockToleranceSeconds: number;
    private readonly now: () => number;
    private cachedKeys: readonly JWK[] | undefined;
    private cacheExpiresAt = 0;

    constructor(
        private readonly configuration: CognitoConfiguration,
        options: CognitoJwtVerifierOptions = {},
    ) {
        this.fetcher = options.fetcher ?? fetch;
        this.cacheTtlMs = options.cacheTtlMs ?? defaultCacheTtlMs;
        this.clockToleranceSeconds =
            options.clockToleranceSeconds ?? defaultClockToleranceSeconds;
        this.now = options.now ?? Date.now;
    }

    async verify(token: string): Promise<ProviderVerificationResult> {
        if (typeof token !== 'string' || token.trim() === '') {
            return failure('MALFORMED_TOKEN');
        }

        let header: ReturnType<typeof decodeProtectedHeader>;
        try {
            header = decodeProtectedHeader(token);
        } catch {
            return failure('MALFORMED_TOKEN');
        }

        if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
            return failure('INVALID_CLAIMS');
        }

        const issuer = this.issuer;
        let keyResult = await this.keyFor(header.kid, false);
        if (!keyResult.ok) {
            return failure(keyResult.code);
        }

        if (keyResult.key === undefined) {
            keyResult = await this.keyFor(header.kid, true);
            if (!keyResult.ok) {
                return failure(keyResult.code);
            }
        }

        if (keyResult.key === undefined) {
            return failure('INVALID_SIGNATURE');
        }

        try {
            const verified = await jwtVerify(token, keyResult.key, {
                algorithms: ['RS256'],
                issuer,
                audience: this.configuration.clientId,
                clockTolerance: this.clockToleranceSeconds,
            });
            const tokenUse = verified.payload.token_use;
            const subject = verified.payload.sub;
            if (
                typeof verified.payload.exp !== 'number' ||
                !Number.isFinite(verified.payload.exp)
            ) {
                return failure('INVALID_CLAIMS');
            }
            if (
                tokenUse !== 'id' ||
                typeof subject !== 'string' ||
                subject === ''
            ) {
                return failure(
                    tokenUse === 'id' ? 'INVALID_CLAIMS' : 'INVALID_TOKEN_USE',
                );
            }

            return {
                ok: true,
                identity: { subject, tokenUse: 'id' },
            };
        } catch (error) {
            return failure(classifyJwtError(error));
        }
    }

    private async keyFor(
        kid: string,
        forceRefresh: boolean,
    ): Promise<
        | { readonly ok: true; readonly key?: VerificationKey }
        | { readonly ok: false; readonly code: ProviderVerificationFailureCode }
    > {
        const keysResult = await this.keys(forceRefresh);
        if (!keysResult.ok) return keysResult;

        const jwk = keysResult.keys.find((candidate) => candidate.kid === kid);
        if (jwk === undefined) return { ok: true };

        try {
            return {
                ok: true,
                key: await importJWK(jwk, 'RS256'),
            };
        } catch {
            return { ok: false, code: 'INVALID_CLAIMS' };
        }
    }

    private async keys(forceRefresh: boolean): Promise<
        | { readonly ok: true; readonly keys: readonly JWK[] }
        | {
              readonly ok: false;
              readonly code: ProviderVerificationFailureCode;
          }
    > {
        if (
            !forceRefresh &&
            this.cachedKeys !== undefined &&
            this.cacheExpiresAt > this.now()
        ) {
            return { ok: true, keys: this.cachedKeys };
        }

        try {
            const response = await this.fetcher(this.jwksUri);
            if (!response.ok) return { ok: false, code: 'DEPENDENCY_ERROR' };
            const document: unknown = await response.json();
            if (!isJwksDocument(document)) {
                return { ok: false, code: 'INVALID_CLAIMS' };
            }
            this.cachedKeys = document.keys;
            this.cacheExpiresAt = this.now() + this.cacheTtlMs;
            return { ok: true, keys: document.keys };
        } catch {
            return { ok: false, code: 'DEPENDENCY_ERROR' };
        }
    }

    private get issuer(): string {
        return `https://cognito-idp.${this.configuration.region}.amazonaws.com/${this.configuration.userPoolId}`;
    }

    private get jwksUri(): string {
        return `${this.issuer}/.well-known/jwks.json`;
    }
}

export {
    CognitoJwtVerifier as CognitoAuthenticationAdapter,
    CognitoJwtVerifier as CognitoTokenVerifier,
};

function failure(
    code: ProviderVerificationFailureCode,
): ProviderVerificationResult {
    return { ok: false, failure: { code } };
}

function isJwksDocument(value: unknown): value is JwksDocument {
    return (
        typeof value === 'object' &&
        value !== null &&
        Array.isArray((value as { keys?: unknown }).keys) &&
        (value as { keys: unknown[] }).keys.every(
            (key) => typeof key === 'object' && key !== null,
        )
    );
}

function classifyJwtError(error: unknown): ProviderVerificationFailureCode {
    if (error instanceof Error) {
        if (error.name === 'JWTExpired') return 'EXPIRED_TOKEN';
        if (error.name === 'JWSSignatureVerificationFailed') {
            return 'INVALID_SIGNATURE';
        }
        if (error.name === 'JWTClaimValidationFailed') {
            const claim = getClaimName(error);
            if (claim === 'iss') return 'WRONG_ISSUER';
            if (claim === 'aud') return 'WRONG_AUDIENCE';
            const message = error.message.toLowerCase();
            if (message.includes('issuer')) return 'WRONG_ISSUER';
            if (message.includes('audience')) return 'WRONG_AUDIENCE';
            if (message.includes('nbf') || message.includes('iat')) {
                return 'INVALID_CLAIMS';
            }
        }
    }
    return 'INVALID_CLAIMS';
}

function getClaimName(error: Error): string | undefined {
    if (typeof error === 'object' && error !== null && 'claim' in error) {
        const claim = (error as { claim?: unknown }).claim;
        return typeof claim === 'string' ? claim : undefined;
    }
    return undefined;
}
