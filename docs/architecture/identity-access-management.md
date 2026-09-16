# GISI Identity & Access Management Architecture

- **Status:** Defined for Phase 1
- **Scope:** Version 1.0 Identity & Access Management
- **Governing provider decision:** [ADR 0005](../decisions/0005-authentication.md)

## Purpose

The Identity & Access Management (IAM) module controls GISI access through
application-owned identity mapping and authorization contracts. It provides
the boundary that future modules use to authenticate a request and authorize
an action without depending on Cognito, IAM persistence details, or another
module's internals.

This document defines the IAM architecture and provider-neutral boundaries.
Authentication verification and principal mapping are implemented for Phase 1;
authorization, HTTP endpoints, and database migrations remain separate tasks.

## Ownership boundary

### IAM owns

The `identity-access` module owns:

- the internal user identity associated with an authenticated external
  subject;
- account status as it affects GISI access;
- GISI roles and permissions;
- role and permission assignments and lifecycle;
- server-side authorization policy evaluation;
- safe authentication and authorization result contracts;
- the application authentication context consumed by use cases;
- IAM-related audit events through the approved audit contract.

The Phase 1 user-management application boundary now also owns authorized
provisioning, exact lookup by internal identifier or Cognito subject, approved
user updates, and explicit account-status transitions. It does not create a
user during authentication.

IAM is the authority for whether an authenticated principal may perform a GISI
action. It does not make business decisions owned by Student, Finance,
Activation, or other modules.

### Cognito and infrastructure own

AWS Cognito remains the initial identity provider under [ADR
0005](../decisions/0005-authentication.md). Cognito owns:

- password storage and credential security;
- hosted or provider login and logout flows;
- password reset and password-change workflows;
- provider session and token issuance;
- token refresh;
- provider account-security controls.

The Cognito adapter under `src/infrastructure/authentication/` owns provider
configuration, token parsing and verification, key retrieval, provider-error
translation, and credential/provider interaction. It must not expose Cognito
types, tokens, provider errors, or provider-specific assumptions through
domain or application contracts.

GISI does not build custom password hashing, replace Cognito's login flow, or
create a competing application-managed primary session system.

## Application-owned contracts

The contracts below are binding contracts for the IAM module. Their concrete
TypeScript definitions live in
`src/modules/identity-access/contracts/authentication.ts` and remain free of
Fastify, Prisma, AWS SDK, Cognito, and infrastructure-adapter types.

### Authentication verifier

The authentication verifier accepts an explicitly supplied credential or token
input and returns either a verified application principal or a safe
authentication failure.

The verifier contract must:

- validate issuer, audience, signature, expiry, and other required provider
  claims through the Cognito adapter;
- map the verified provider subject to a non-secret GISI principal identity;
- provide authentication assurance/context required by authorization;
- avoid trusting caller-supplied identity, role, or permission claims;
- return provider-neutral failures that map to `UNAUTHORIZED`;
- never return raw tokens, credentials, provider errors, or key material.

The verifier verifies and maps. It does not reimplement authentication.

### Principal and authentication context

An authenticated principal represents the identity accepted by GISI. It
contains only approved, non-secret identity data, including:

- a stable internal or mapped subject identifier;
- actor type;
- authentication assurance or context;
- approved institution or tenant context where applicable.

The API boundary attaches the resulting authentication context to the request
lifecycle after verification. Application use cases receive that context
explicitly; they must not read request globals or decode provider tokens
themselves.

### Authorization policy

The authorization policy evaluates:

- the authenticated principal;
- an action;
- a resource type;
- resource context needed for the decision.

It returns an allow or deny decision with a safe, provider-neutral denial
reason. Policy evaluation is server-side and occurs before the protected use
case executes. Missing or invalid authentication maps to `UNAUTHORIZED`;
authenticated principals without permission map to `FORBIDDEN`.

Authorization may use roles and permissions owned by IAM, but a consuming
module supplies its action and resource context through the contract. IAM
does not reach into consuming modules to implement their business rules.

### Audit integration

Authentication outcomes, logout events, role changes, permission changes,
account-status changes, and required authorization events use the approved
audit contract. Operational logs do not replace audit records. Audit payloads
must contain safe identifiers and outcomes, never passwords, tokens, provider
credentials, or raw Cognito errors.

## Module structure

IAM code will live under:

```text
src/modules/identity-access/
├── api/
├── application/
├── domain/
├── infrastructure/
└── tests/
```

The internal responsibilities follow the approved module-boundary rules:

- `domain/` owns provider-neutral identity, role, permission, account-status,
  and authorization concepts. It imports no API, framework, database, AWS, or
  infrastructure implementation.
- `application/` owns authentication and authorization use cases, ports,
  policy orchestration, and explicit application contracts.
- `infrastructure/` owns adapters for Cognito, persistence, and external
  services. It implements application/domain contracts.
- `api/` owns Fastify route registration, request validation, authentication
  middleware wiring, response mapping, and transport concerns. It does not
  contain IAM business rules.
- `tests/` contains tests for the module at the narrowest applicable boundary.

The bootstrap composition root creates the IAM module context, supplies
infrastructure implementations, and registers the module API. It does not
implement IAM business rules.

## Cross-module consumption

Student, Finance, Activation, and later modules depend only on the approved
IAM application contracts:

1. The API boundary establishes authentication context.
2. A module application use case receives the principal/context explicitly.
3. The use case asks the IAM authorization contract to evaluate an action,
   resource type, and resource context.
4. The use case proceeds only when the policy allows the action.

Other modules must not:

- import IAM repositories, Prisma models, Cognito adapters, or infrastructure
  implementations;
- read or write IAM-owned tables directly;
- decode Cognito tokens or inspect provider claims independently;
- copy roles or permissions into shared database access;
- bypass the authorization contract through a shared helper or hidden query.

Cross-module behavior uses an explicit application-level contract or a
documented domain/application event. IAM owns identity and authorization
decisions; consuming modules retain ownership of their own business rules and
data.

## Composition and security constraints

- `src/bootstrap/` assembles IAM and supplies validated configuration.
- `src/infrastructure/authentication/cognito-configuration.ts` remains the
  configuration boundary for Cognito settings.
- AWS SDK and Cognito types remain outside domain and application contracts.
- Authentication and authorization failures use the established API error
  taxonomy and correlation context.
- Provider errors and sensitive values are translated and redacted before
  reaching application contracts, logs, audit records, or responses.
- The module preserves historical accountability for account, role,
  permission, and authorization changes.

## Explicit non-scope

This architecture task does not define:

- IAM tables, columns, Prisma models, or migrations;
- concrete authentication or authorization algorithms;
- Cognito infrastructure provisioning;
- Fastify routes or endpoint schemas;
- password hashing or application-managed primary sessions;
- Student, Finance, Activation, or other business-module behavior.
