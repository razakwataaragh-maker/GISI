# ADR 0021: Cognito Verification and Pre-Provisioned GISI Principals

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

ADR 0005 selects Cognito as the identity provider and ADR 0020 establishes
the application-owned IAM boundary. The implementation still needs a binding
decision for token verification, first-seen subject mapping, account-status
enforcement, lifecycle ownership, and safe provider-failure behavior.

## Decision

GISI will verify Cognito-issued tokens through an infrastructure adapter that
validates signature, issuer, audience, token-use, required claims, and time
validity. The adapter will cache Cognito JWKS keys, refresh once on an unknown
key identifier to support rotation, and fail closed when verification cannot
be established.

Verified Cognito subjects must map to pre-provisioned internal GISI users.
GISI will not auto-create internal users at first authentication. An
authorized institutional provisioning process must establish the mapping and
initial access state before protected access is granted.

Cognito owns passwords, login/logout flows, recovery, provider sessions, and
token issuance/refresh. GISI verifies and maps the resulting identity,
enforces internal account status, establishes request authentication context,
and records safe authentication audit events. GISI does not build custom
password hashing or a competing primary session system.

Provider-specific failures are translated to safe outcomes: invalid,
expired, revoked, malformed, or unverifiable credentials are unauthorized;
provider/network inability to verify is a dependency failure; unmapped
subjects are denied; and inactive internal accounts are forbidden. Raw
provider details never cross the API, application, logging, or audit
boundaries.

## Alternatives rejected

- Auto-provisioning every first-seen Cognito subject, because it would grant
  identity-provider membership the power to create institutional accounts
  without approved internal provisioning.
- Accepting valid Cognito tokens without an internal account-status check,
  because deactivated GISI users must lose access immediately even if their
  provider session remains valid.
- Failing open during JWKS or provider outages, because unverifiable identity
  cannot be treated as authenticated.
- Recording raw provider failures or credentials in audit records, because
  auditability does not justify retaining secrets or provider internals.

## Consequences

Institutional provisioning is required before first use, and account status
must be checked on authenticated requests. Token verification remains
provider-specific but isolated, while the application receives stable
provider-neutral principals and outcomes. Cognito remains responsible for
credential security and session/token lifecycle.
