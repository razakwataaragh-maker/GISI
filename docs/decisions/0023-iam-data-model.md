# ADR 0023: IAM-Owned Historical Identity and Assignment Model

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

The IAM architecture requires pre-provisioned internal users mapped to Cognito
subjects, role-based authorization with resource context, historical
preservation, and a controlled administrator bootstrap. A concrete persistence
boundary is needed before the IAM schema and migrations are implemented.

## Decision

The identity-access module will own conceptual user, role, role-permission
relationship, and user-role assignment entities. A Cognito subject maps to at
most one internal user through a unique non-secret subject identifier. Users
store account status and audit-relevant lifecycle metadata, but never
passwords, tokens, sessions, or Cognito credentials.

Roles bundle stable permissions declared by module-owned code registries.
Database relationships may reference those identifiers, but administrators
cannot invent arbitrary permission capabilities at runtime. Role-permission
and user-role relationships are historically preserved: revocation changes
state and records actor/time/reason rather than physically deleting history.

Ordinary IAM administration uses the same role and assignment model as every
other authority. The initial system administrator is established only by an
explicit, controlled, auditable provisioning operation for a pre-provisioned
user. No default administrator, first-login grant, Cognito claim, or insecure
seed is permitted.

The eventual PostgreSQL schema must enforce ownership, foreign keys,
non-nullability, status constraints, uniqueness, safe delete behavior, and
indexes for subject and active-assignment lookups. IAM operational tables
remain separate from audit-record storage; IAM emits the approved audit
contract instead of writing audit tables directly.

## Alternatives rejected

- Auto-creating users on first Cognito authentication, because it bypasses
  institutional provisioning and deliberate authorization assignment.
- Storing passwords, tokens, or provider sessions in IAM, because Cognito
  owns credential and provider-session security.
- Treating permissions as unrestricted runtime database input, because stable
  module ownership and reviewability would be lost.
- Physically deleting revoked assignments, because historical accountability
  would be destroyed.
- Seeding a permanently active administrator, because it creates an
  insecure default authority.

## Consequences

The next persistence task must translate this model into reviewed PostgreSQL
and Prisma migrations. Authorization queries require indexes for the
per-request Cognito-subject lookup and active role/permission traversal.
Provisioning and bootstrap operations require explicit audit and operational
controls. Permission registry changes remain coordinated with application
releases and migration review.
