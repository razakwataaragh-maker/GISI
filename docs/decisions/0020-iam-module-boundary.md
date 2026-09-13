# ADR 0020: Application-Owned IAM Module Boundary

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

ADR 0005 selects AWS Cognito behind an authentication interface, but it does
not define the complete application-owned boundary for the Phase 1 Identity &
Access Management module. Future GISI modules need a stable way to consume
authentication context and authorization decisions without coupling themselves
to Cognito, IAM persistence, or infrastructure adapters.

## Decision

GISI will implement Identity & Access Management as an application-owned
`src/modules/identity-access/` module with provider-neutral contracts for:

- authentication verification and principal mapping;
- explicit authentication context propagation;
- server-side authorization policy evaluation;
- IAM audit integration.

The module owns internal user identity mapping, account status, roles,
permissions, assignments, and authorization decisions. Cognito remains
responsible for password storage, login/logout flows, password recovery,
provider sessions, and token issuance/refresh. The Cognito adapter verifies
and translates provider credentials behind the infrastructure boundary; it
does not leak provider types or errors into application contracts.

Other modules must consume IAM through explicit application contracts or
documented events. They must not import IAM repositories or adapters, access
IAM tables directly, decode Cognito tokens, or bypass server-side policy
evaluation.

The module follows the standard API → application → domain → contracts and
infrastructure → contracts direction. Domain and application contracts may
not depend on Fastify, Prisma, AWS SDK, Cognito, or infrastructure
implementations.

## Alternatives rejected

- Allowing each business module to decode Cognito tokens, because this
  duplicates security-sensitive provider handling and creates inconsistent
  authorization.
- Treating Cognito roles or claims as GISI authorization, because GISI owns
  server-side business permissions and policy enforcement.
- Sharing IAM tables or repositories across modules, because it violates
  module ownership, historical accountability, and migration boundaries.
- Implementing custom password hashing or a competing primary session system,
  because ADR 0005 assigns those responsibilities to Cognito.

## Consequences

IAM provides a single auditable authorization boundary and keeps business
modules independent from the initial identity provider. The boundary requires
explicit context and policy calls, and it adds application contracts that must
be maintained as new modules are introduced. Cognito remains replaceable
because provider-specific behavior is isolated behind infrastructure.
