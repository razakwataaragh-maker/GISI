# GISI Security Baseline

## Purpose and scope

This document defines the Version 1.0 security baseline for the API and
modular monolith. It establishes boundaries and required behavior for secrets,
transport security, HTTP hardening, cross-origin access, abuse prevention,
dependency risk, input validation, and authentication/authorization.

This is a specification only. It does not implement security middleware,
rate limiting, CORS, authentication, authorization, or provider integration.

## Secrets handling

Secrets are values that grant access or enable impersonation, including
database credentials and URLs containing credentials, client secrets, private
keys, signing keys, tokens, passwords, and payment-provider credentials.

- Runtime secrets enter the application only through approved environment
  values consumed at the existing configuration boundary.
- `src/bootstrap/configuration.ts` and approved infrastructure-specific
  configuration boundaries validate and expose typed values; application and
  domain code receives only the values it requires through dependency
  injection.
- Local development may use explicitly supplied Node.js 22 `--env-file` input.
  Real local secret files remain ignored by Git. `.env.example` contains
  placeholders only.
- Staging and production receive secrets from deployment configuration or an
  AWS-managed secret provider. The application must not discover `.env.local`
  or read arbitrary files at runtime.
- Future AWS Secrets Manager or SSM Parameter Store integration belongs in an
  infrastructure adapter and must resolve secrets before or during explicit
  composition-root startup. Provider SDK types and retrieval logic must not
  cross into domain or application contracts.
- Secret rotation must not require source-code changes. The deployment process
  must support replacement and revocation without exposing old values.

Secrets must never be committed to source code, configuration templates,
tests, fixtures, documentation, Git history, URLs, structured logs, audit
records, error responses, or API response bodies. Redaction is defense in
depth; code must avoid passing secrets to loggers or errors in the first
place. Secret scanning is required in CI, and an exposed credential must be
revoked and replaced rather than merely deleted from the working tree.

Non-secret identifiers such as an AWS region or Cognito user-pool ID are not
credentials, but should still be excluded from unnecessary diagnostics.

## Transport security

| Environment | Requirement |
|---|---|
| Local development | HTTP is permitted for loopback-only development and automated tests. Local HTTPS may be used when testing proxy, cookie, or TLS behavior. Test fixtures must never contain real credentials. |
| Staging | HTTPS is mandatory at the externally reachable boundary. TLS terminates at the approved ingress/load balancer or application edge, with secure forwarding configuration and no plaintext external fallback. |
| Production | HTTPS is mandatory. TLS certificates, private keys, protocol versions, cipher policy, renewal, and redirect behavior are managed by the deployment edge. Plain HTTP must redirect or be rejected according to the ingress policy and must never carry authenticated or sensitive data. |

The application must trust proxy headers only from explicitly configured trusted
proxies. TLS termination does not permit internal components to disable
authorization, secure-cookie, or secure-header requirements.

## Secure HTTP headers

The HTTP/API edge security layer owns default security headers. Routes and
business modules must not set competing values.

Deployed responses must include, unless an approved endpoint-specific policy
documents an exception:

- `Strict-Transport-Security` (HSTS) in staging and production only, with a
  reviewed max-age and `includeSubDomains` policy;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`, or a CSP `frame-ancestors` policy when an approved
  embedding requirement exists;
- `Referrer-Policy: no-referrer` or another explicitly reviewed restrictive
  policy;
- a restrictive `Content-Security-Policy` where browser-rendered content is
  served by the boundary;
- `Cache-Control: no-store` for authentication, personal, financial, and
  other sensitive responses where caching is not explicitly required.

The future Fastify HTTP security plugin or equivalent edge adapter owns these
headers and their tests. Header policy is infrastructure/API-boundary
behavior, not domain logic.

## CORS policy

CORS is enforced at the HTTP boundary before application work:

- Development allows only explicitly configured local frontend origins.
- Staging allows only the registered staging frontend origins.
- Production allows only an allowlist of approved institutional frontend
  origins, maintained through deployment configuration.
- Wildcard origins (`*`) are prohibited in production and must not be combined
  with credentials.
- Allowed methods, request headers, exposed response headers, and credential
  behavior are explicit and minimal. `X-Correlation-ID` may be allowed or
  exposed when required by the approved client contract.
- Unknown origins are rejected or receive no permissive CORS response.

The CORS policy is environment configuration validated at startup. It is not
implemented in application services and must not be inferred from request
input.

## Rate-limiting boundaries

Rate limiting is enforced outside domain and business logic, at the edge/API
boundary and, where required, at the identity-provider or infrastructure
boundary. The policy must support separate limits for:

- unauthenticated authentication and recovery operations;
- public endpoints;
- authenticated user/API identities;
- sensitive administrative and financial operations;
- expensive reporting or export operations.

Limits, keys, windows, burst behavior, and trusted proxy handling are
environment-specific configuration. A rejected request uses the approved API
error contract and does not reveal internal limiter state. Business modules
must not implement their own competing limiter or depend on a limiter to
enforce a domain invariant. Rate-limit events and administrative policy
changes are operationally logged and auditable where they are security or
administrative events, without recording credentials.

## Dependency and supply-chain scanning

The repository uses npm and GitHub Actions. CI must run dependency checks on
pull requests and protected branches, and before deployment:

- `npm audit --audit-level=high` is a blocking check;
- high and critical vulnerabilities fail the build unless a time-bounded,
  reviewed exception is recorded with owner, rationale, mitigation, and
  expiry;
- moderate and low findings are reported and triaged according to project
  policy;
- lockfile changes require review and CI installs must honor the committed
  lockfile;
- secret scanning and dependency review run alongside audit scanning;
- production dependency installation must be reproducible and must not
  introduce unreviewed packages.

Security checks must not be bypassed by application code or by suppressing
audit output. Exceptions do not permit shipping a known exploitable critical
issue without explicit governance approval.

## Input-validation baseline

Every future endpoint validates all path parameters, query parameters, headers,
and request bodies at the API boundary before application work. Schemas must:

- reject malformed JSON, unsupported content types, unexpected fields, invalid
  types, unsafe lengths, invalid formats, and impossible ranges;
- enforce request-size and pagination limits;
- normalize only where the endpoint contract explicitly permits it;
- treat all client input as untrusted and never use client-supplied actor IDs
  as authenticated identity;
- validate authorization-relevant identifiers and state transitions in the
  application/domain layer as well as transport shape at the API layer;
- avoid logging or echoing rejected secrets and sensitive payloads.

Validation failures use the binding taxonomy in
`docs/api/error-taxonomy.md`: safe field/rule details may be returned for
`VALIDATION_ERROR` (422), while internal parser, provider, and implementation
details are never exposed. Validation is not a substitute for authorization,
database constraints, or business invariants.

## Authentication and authorization interfaces

Future modules depend on application-owned interfaces, not Cognito or another
provider:

- **Authentication verifier:** accepts an explicitly defined credential/token
  input and returns a verified authenticated principal or a safe failure;
- **Principal:** contains a stable non-secret subject identifier, actor type,
  authentication assurance/context, and approved tenant/institution context
  where applicable;
- **Authorization policy:** evaluates a principal, action, resource type, and
  resource context, returning an allow/deny decision and safe denial reason;
- **Authentication context:** is attached to the request lifecycle by the API
  boundary after verification and is passed explicitly to application use
  cases;
- **Audit integration:** authentication, logout, role, and permission events
  use the audit contract; they are not satisfied by operational logs alone.

Missing or invalid authentication maps to `UNAUTHORIZED`; an authenticated
principal without permission maps to `FORBIDDEN`. Authorization is always
server-side, occurs before use-case execution, and must not trust role or user
claims supplied independently by a caller.

The future Cognito adapter implements the authentication interface behind the
infrastructure boundary. It owns provider token parsing, key retrieval,
provider error translation, and credential handling. It must not leak provider
errors or tokens into application contracts, logs, audit records, or API
responses. This baseline does not implement Cognito, sessions, login, or
authorization policies.

## Ownership and enforcement

The HTTP/API infrastructure boundary owns TLS-aware proxy handling, headers,
CORS, request limits, rate limiting, authentication middleware wiring, and
safe translation into the API error boundary. Configuration is validated at
bootstrap. The audit/compliance capability owns required security audit
records. Application and domain modules own business authorization rules but
must consume the approved principal and policy contracts.

