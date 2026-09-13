# ADR 0022: Context-Aware Role-Based Authorization

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

ADR 0020 establishes an application-owned IAM boundary, but Phase 1 requires
an authorization model that is specific enough for administrative role
management and flexible enough for future Student, Finance, Activation, and
other modules. Role membership alone cannot safely express access to a
particular record, institution, or operational scope.

## Decision

GISI will use deny-by-default role-based authorization with resource-level
context. Roles are named bundles of stable, module-owned permissions. A
principal may hold multiple active roles, and effective permissions are
evaluated together with the action, resource type, and safe resource context
provided by the consuming module.

Consuming modules declare their own permission identifiers and call the IAM
authorization contract. They retain ownership of resource data, validation,
business invariants, and context construction. IAM must not query consuming
module tables or expose its repositories.

Role and permission administration is permission-gated and constrained by
delegation scope. An actor cannot grant itself or another principal a
permission or role exceeding the actor's authority. A controlled,
audited, explicitly provisioned system-administrator bootstrap establishes
the initial administrative authority; Cognito claims, first login, and email
addresses cannot bootstrap it.

Authorization failures return stable, minimal outcomes. `FORBIDDEN` does not
reveal roles, missing permissions, policy details, or resource existence.
Where resource visibility requires concealment, the API uses the approved
`NOT_FOUND` behavior.

Security and authorization administration events are append-only audit records
with safe actor, target, outcome, correlation, and change context. Secrets,
provider details, and hidden resource data are prohibited.

## Alternatives rejected

- Pure role-only checks, because they cannot safely express record,
  institutional, ownership, or lifecycle scope.
- Module-specific authorization implementations, because they create
  inconsistent enforcement and bypass the IAM boundary.
- Auto-granting or self-assigning a system administrator, because identity
  provider membership is not institutional authorization.
- Returning detailed denial reasons or resource existence, because it leaks
  policy and protected-resource information.

## Consequences

Future modules must publish stable permission contracts and supply safe
resource context for protected operations. IAM remains independent of module
business data, but authorization calls and delegation rules require explicit
review. The model supports least privilege, institutional scoping, and
historical auditability without coupling GISI authorization to Cognito.
