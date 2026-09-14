import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { CognitoJwtVerifier } from '../../src/infrastructure/authentication/cognito-jwt-verifier.js';
import { AuthenticateUser } from '../../src/modules/identity-access/application/authenticate-user.js';
import type { AuditEventInput } from '../../src/modules/audit/domain/audit-writer.js';

const configuration = {
    region: 'eu-west-1',
    userPoolId: 'eu-west-1_example',
    clientId: 'example-client',
} as const;
const issuer = `https://cognito-idp.${configuration.region}.amazonaws.com/${configuration.userPoolId}`;
const kid = 'test-key';

let signingKey: CryptoKey;
let verificationJwk: Record<string, unknown>;

beforeAll(async () => {
    const keys = await generateKeyPair('RS256');
    signingKey = keys.privateKey;
    verificationJwk = await exportJWK(keys.publicKey);
});

function fetcher(): typeof fetch {
    return async () =>
        new Response(JSON.stringify({ keys: [{ ...verificationJwk, kid }] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
}

async function token(
    claims: Record<string, unknown> = {},
    key: CryptoKey = signingKey,
): Promise<string> {
    return new SignJWT({
        sub: 'cognito-subject',
        token_use: 'id',
        ...claims,
    })
        .setProtectedHeader({ alg: 'RS256', kid })
        .setIssuer(issuer)
        .setAudience(configuration.clientId)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(key);
}

function verifier(): CognitoJwtVerifier {
    return new CognitoJwtVerifier(configuration, {
        fetcher: fetcher(),
        cacheTtlMs: 60_000,
    });
}

describe('CognitoJwtVerifier', () => {
    it('accepts a valid Cognito JWT', async () => {
        await expect(verifier().verify(await token())).resolves.toEqual({
            ok: true,
            identity: { subject: 'cognito-subject', tokenUse: 'id' },
        });
    });

    it('rejects a token with an invalid signature', async () => {
        const otherKeys = await generateKeyPair('RS256');
        await expect(
            verifier().verify(await token({}, otherKeys.privateKey)),
        ).resolves.toEqual({
            ok: false,
            failure: { code: 'INVALID_SIGNATURE' },
        });
    });

    it('rejects an expired token', async () => {
        const expired = await new SignJWT({
            sub: 'cognito-subject',
            token_use: 'id',
        })
            .setProtectedHeader({ alg: 'RS256', kid })
            .setIssuer(issuer)
            .setAudience(configuration.clientId)
            .setIssuedAt()
            .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
            .sign(signingKey);

        await expect(verifier().verify(expired)).resolves.toEqual({
            ok: false,
            failure: { code: 'EXPIRED_TOKEN' },
        });
    });

    it('rejects a token with the wrong issuer', async () => {
        const wrongIssuer = await new SignJWT({
            sub: 'cognito-subject',
            token_use: 'id',
        })
            .setProtectedHeader({ alg: 'RS256', kid })
            .setIssuer('https://issuer.example.test')
            .setAudience(configuration.clientId)
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(signingKey);

        await expect(verifier().verify(wrongIssuer)).resolves.toEqual({
            ok: false,
            failure: { code: 'WRONG_ISSUER' },
        });
    });

    it('rejects a token with the wrong audience', async () => {
        const wrongAudience = await new SignJWT({
            sub: 'cognito-subject',
            token_use: 'id',
        })
            .setProtectedHeader({ alg: 'RS256', kid })
            .setIssuer(issuer)
            .setAudience('wrong-client')
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(signingKey);

        await expect(verifier().verify(wrongAudience)).resolves.toEqual({
            ok: false,
            failure: { code: 'WRONG_AUDIENCE' },
        });
    });
});

describe('AuthenticateUser', () => {
    function auditWriter(events: AuditEventInput[]) {
        return {
            append: async (event: AuditEventInput) => {
                events.push(event);
                return {
                    id: 'audit-1',
                    ...event,
                    occurredAt: event.occurredAt ?? new Date(),
                    recordedAt: new Date(),
                };
            },
        };
    }

    it('denies a verified but unmapped subject', async () => {
        const events: AuditEventInput[] = [];
        const service = new AuthenticateUser({
            tokenVerifier: {
                verify: async () => ({
                    ok: true,
                    identity: { subject: 'unknown', tokenUse: 'id' },
                }),
            },
            userRepository: {
                findByCognitoSubject: async () => null,
            },
            auditWriter: auditWriter(events),
        });

        await expect(service.execute({ token: 'opaque' })).resolves.toEqual({
            ok: false,
            failure: { code: 'UNAUTHORIZED', reason: 'UNMAPPED_SUBJECT' },
        });
        expect(events[0]).toMatchObject({
            eventName: 'authentication_denied_unmapped_subject',
            outcome: 'failure',
            reason: 'UNMAPPED_SUBJECT',
        });
        expect(events[0]).not.toHaveProperty('token');
    });

    it.each([
        ['INVALID_SIGNATURE', 'UNAUTHORIZED'],
        ['EXPIRED_TOKEN', 'UNAUTHORIZED'],
        ['WRONG_ISSUER', 'UNAUTHORIZED'],
    ] as const)('records a safe audit event for %s', async (reason, code) => {
        const events: AuditEventInput[] = [];
        const service = new AuthenticateUser({
            tokenVerifier: {
                verify: async () => ({
                    ok: false,
                    failure: { code: reason },
                }),
            },
            userRepository: {
                findByCognitoSubject: async () => null,
            },
            auditWriter: auditWriter(events),
        });

        await expect(service.execute({ token: 'opaque' })).resolves.toEqual({
            ok: false,
            failure: { code, reason },
        });
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            eventName: 'login_failure',
            actorType: 'anonymous',
            outcome: 'failure',
            reason,
        });
        expect(events[0]).not.toHaveProperty('token');
    });

    it('forbids a deactivated mapped user', async () => {
        const events: AuditEventInput[] = [];
        const service = new AuthenticateUser({
            tokenVerifier: {
                verify: async () => ({
                    ok: true,
                    identity: { subject: 'known', tokenUse: 'id' },
                }),
            },
            userRepository: {
                findByCognitoSubject: async () => ({
                    id: 'user-1',
                    cognitoSubject: 'known',
                    status: 'DEACTIVATED',
                }),
            },
            auditWriter: auditWriter(events),
        });

        await expect(service.execute({ token: 'opaque' })).resolves.toEqual({
            ok: false,
            failure: { code: 'FORBIDDEN', reason: 'INACTIVE_ACCOUNT' },
        });
        expect(events[0]).toMatchObject({
            eventName: 'authentication_denied_inactive_account',
            actorType: 'anonymous',
            targetId: 'user-1',
            reason: 'INACTIVE_ACCOUNT',
        });
    });

    it('denies authentication when the success audit event cannot be written', async () => {
        const service = new AuthenticateUser({
            tokenVerifier: {
                verify: async () => ({
                    ok: true,
                    identity: { subject: 'known', tokenUse: 'id' },
                }),
            },
            userRepository: {
                findByCognitoSubject: async () => ({
                    id: 'user-1',
                    cognitoSubject: 'known',
                    status: 'ACTIVE',
                }),
            },
            auditWriter: {
                append: async () => {
                    throw new Error('audit unavailable');
                },
            },
        });

        await expect(service.execute({ token: 'opaque' })).resolves.toEqual({
            ok: false,
            failure: { code: 'DEPENDENCY_ERROR', reason: 'AUDIT_WRITE_FAILED' },
        });
    });
});
