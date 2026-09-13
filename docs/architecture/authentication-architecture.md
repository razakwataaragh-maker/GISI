# GISI Authentication Architecture

- **Status:** Defined for Phase 1
- **Scope:** Cognito-backed authentication verification and lifecycle
- **Governing decisions:** [ADR 0005](../decisions/0005-authentication.md),
  [ADR 0020](../decisions/0020-iam-module-boundary.md)

## Purpose and boundary

GISI uses AWS Cognito as its initial identity provider. Cognito owns
credential security and provider authentication flows. GISI owns the
provider-neutral authentication contract, verification result, internal
principal mapping, account-status enforcement, authentication context, and
safe audit events.

This document defines the verification and lifecycle design only. It does not
define IAM tables or Prisma models, implement authentication logic, or add
HTTP endpoints.

## Token verification flow

The application/API boundary passes the presented bearer token to the
application-owned authentication verifier. The verifier delegates
provider-specific work to the Cognito infrastructure adapter:

1. Extract exactly one supported bearer token from the request authorization
   input. Missing, duplicated, or malformed credentials fail as
   `UNAUTHORIZED`.
2. Resolve the Cognito user-pool issuer and JWKS endpoint from the validated
   Cognito configuration (`AWS_REGION`, `AWS_USER_POOL_ID`, and
   `AWS_CLIENT_ID`). Provider configuration remains behind
   `src/infrastructure/authentication/cognito-configuration.ts`.
3. Read the token header and select the signing key by its `kid`. The adapter
   retrieves public keys over the approved provider boundary and caches them
   for a bounded period.
4. On an unknown `kid`, refresh the JWKS cache once to support normal key
   rotation, then retry verification. A key that remains unavailable is a
   provider verification failure, not a reason to trust the token.
5. Verify the signature using the approved algorithm and the Cognito public
   key. Algorithm changes or unsupported algorithms fail closed.
6. Validate the issuer exactly against the configured user pool issuer and
   validate the audience/client identifier according to the token type and
   approved Cognito contract. The adapter must not accept an issuer or
   audience supplied by the caller.
7. Validate temporal claims, including expiry and any required not-before
   constraints, using a bounded clock-skew policy. Expired tokens are never
   accepted.
8. Validate required subject and token-use claims. Only the approved Cognito
   token type for the API operation is accepted.
9. Return a provider-neutral verified subject and authentication assurance
   context. Raw tokens, claims not required by the application, keys, and
   provider SDK types do not cross into application or domain contracts.
10. Resolve the internal GISI user mapping and account status before attaching
    the authentication context to the request.

JWKS retrieval failures, malformed keys, signature failures, issuer/audience
failures, and claim failures all fail closed. Key caching and refresh must
avoid making every request depend on a network call while still allowing
normal Cognito key rotation. Cache implementation details and provider errors
remain infrastructure concerns.

## First-seen principal mapping

An authenticated Cognito subject must already have an internal GISI user
record before it can access the application. GISI does not auto-create an
internal user on first successful authentication.

The first-seen flow is:

1. Cognito verification succeeds for the provider subject.
2. GISI looks up the provider-subject mapping through the IAM application
   contract.
3. If no internal user exists, access is denied with a safe
   `UNAUTHORIZED` or configured account-not-provisioned outcome; no user record
   is created.
4. An authorized administrative or institutional provisioning process creates
   and links the internal user before the user can use GISI.
5. Subsequent requests must still pass the internal account-status check.

Pre-provisioning prevents arbitrary Cognito identities from becoming
authoritative GISI users, preserves institutional ownership of access, and
ensures roles and permissions are assigned deliberately. It also keeps
identity creation and authorization auditable. The specific user data model
and provisioning use cases belong to later IAM tasks.

## Account-status enforcement

Cognito validity is necessary but not sufficient for GISI access. After token
verification and principal mapping, GISI evaluates the internal account
status:

- active internal accounts may continue to authorization evaluation;
- deactivated or suspended accounts are denied before protected use-case
  execution, even when Cognito considers the token valid;
- unknown or unmapped subjects cannot access protected resources;
- status changes take effect on the next authenticated request and must not
  be bypassed by a previously issued token.

The denial is provider-neutral and does not reveal whether an account exists
to an unauthenticated caller beyond the approved API contract.

## Authentication lifecycle from GISI's perspective

### Login

Cognito owns the credential collection, login challenge, password policy,
multi-factor or other configured provider controls, and token issuance. GISI
does not receive or store the user's password.

The future API/application integration either redirects the client to the
approved Cognito flow or invokes the approved Cognito client flow. After
Cognito confirms authentication, the client presents the resulting token to
GISI. GISI verifies the token, maps the subject to a pre-provisioned internal
user, checks account status, and creates the request-scoped GISI
authentication context. GISI does not issue a second primary credential or
duplicate Cognito sessions.

### Logout

The client invokes the approved Cognito logout/revocation flow to terminate
the provider session or revoke credentials according to Cognito capabilities.
GISI may expose a provider-neutral logout integration later, but its role is
to invoke the adapter, clear any GISI request/client state it owns, and record
the safe outcome. GISI must not claim that a locally observed request is a
provider logout unless Cognito confirms the operation.

### Password reset and password change

Cognito owns password reset, password change, verification challenges, and
credential policy. GISI initiates or redirects to the corresponding Cognito
flow through the adapter/client boundary and returns only the approved
provider-neutral result. GISI never receives, stores, hashes, logs, or audits
the password or recovery secret.

### Token refresh

The client performs the approved Cognito refresh flow. When a refreshed token
is presented to GISI, the same signature, issuer, audience, expiry, token-use,
principal-mapping, and internal account-status checks apply. GISI does not
mint a competing refresh token. A failed refresh is handled as a safe
authentication failure and the client must authenticate again through
Cognito.

## Provider-failure classification

The Cognito adapter translates provider-specific failures to a small
provider-neutral result. Details are logged only through safe structured
diagnostics and are never returned to callers or written to audit records.

| Provider condition                                                                                            | GISI outcome                                                  | Safe external behavior                                           |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Missing, malformed, unsupported, or structurally invalid token                                                | `UNAUTHORIZED`                                                | Request is rejected without indicating token parsing details     |
| Invalid signature, unknown/unrefreshable key, wrong algorithm, issuer, audience, token-use, or required claim | `UNAUTHORIZED`                                                | Request is rejected with the standard authentication error       |
| Expired or not-yet-valid token                                                                                | `UNAUTHORIZED`                                                | Client must use Cognito refresh or authenticate again            |
| Revoked, invalidated, or otherwise rejected provider credential                                               | `UNAUTHORIZED`                                                | Client must authenticate again; provider reason is not disclosed |
| Cognito/JWKS network timeout or provider outage during verification                                           | `DEPENDENCY_ERROR` when the system cannot verify the request  | Safe dependency failure; no fail-open behavior                   |
| Cognito service rejection during logout, reset, or refresh                                                    | Provider-neutral operation failure mapped by the API contract | No raw provider message, code, token, or response is exposed     |
| Verified principal with no internal user mapping                                                              | `UNAUTHORIZED` or configured not-provisioned outcome          | Access denied; no auto-provisioning                              |
| Verified principal with suspended/deactivated GISI account                                                    | `FORBIDDEN`                                                   | Access denied despite valid Cognito authentication               |

Operational logs may retain a safe provider-neutral category, correlation ID,
operation, and outcome. They must not contain raw provider responses, tokens,
credentials, or stack traces. The API error boundary controls the final
response shape.

## Authentication audit events

Authentication events are append-only audit records through the approved audit
contract, separate from operational logs. Required event names are:

- `login_success`
- `login_failure`
- `logout`
- `password_reset_requested`
- `password_reset_completed`
- `password_change_completed`
- `token_refresh_success`
- `token_refresh_failure`
- `authentication_denied_unmapped_subject`
- `authentication_denied_inactive_account`

Each event records, when available:

- stable audit-record identifier;
- event name and `security` category;
- actor identity and actor type, or explicit anonymous/unknown actor;
- target internal user or safe provider-subject reference, without token data;
- action and outcome;
- UTC occurrence and durable-record timestamps;
- request/process correlation ID;
- initiating channel or source boundary;
- safe provider-neutral failure category;
- reason or approved change reference where applicable;
- owning module (`identity-access`) and source boundary.

Audit records must never contain passwords, password hashes, recovery answers,
access or refresh tokens, cookies, client secrets, private keys, connection
strings, raw provider exceptions, provider response bodies, or stack traces.
Failed login records may identify an anonymous/unknown actor and safe failure
category, but must not preserve submitted credentials.

## Non-scope

This task does not define:

- IAM tables, columns, Prisma models, or migrations;
- concrete SDK/library choices or implementation code;
- Fastify routes or endpoint schemas;
- role and permission policy design beyond the authentication boundary;
- Cognito resource provisioning or deployment configuration.
