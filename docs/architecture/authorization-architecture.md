# GISI Authorization Architecture

- **Status:** Defined for Phase 1
- **Scope:** Roles, permissions, policy evaluation, and authorization governance
- **Governing boundary:** [IAM architecture](identity-access-management.md)
- **Governing audit contract:** [Audit boundary](audit-boundary.md)

## Purpose

GISI authorization is application-owned and server-side. It decides whether
an authenticated principal may perform an action against a resource, while
leaving the resource's business rules and data ownership to the consuming
module.

This document defines authorization concepts and contracts only. It does not
define IAM tables or Prisma models, implement policy logic, or add endpoints.

## Roles and permissions

A **permission** is a stable, provider-neutral capability identified by an
owning module, action, and resource type. Examples include:

- `student.read`
- `student.update`
- `finance.payment.verify`
- `identity-access.role.assign`

Permission names describe an operation, not a user. They are declared by the
module that owns the protected resource and must not encode Cognito-specific
claims.

A **role** is a named, lifecycle-managed bundle of permissions representing an
institutional responsibility, such as an academic officer, finance officer,
or system administrator. A user may hold one or more roles. Effective
permissions are the union of active permissions granted by the user's active
roles, subject to account status and resource-context policy.

Roles and permissions are distinct: permissions are the atomic capabilities;
roles are administrative bundles that make capabilities assignable and
reviewable. Direct user permission grants are not the default model. Any
exception would require an explicit later decision and equivalent audit and
privilege safeguards.

## Authorization decision model

GISI uses **RBAC with resource-level context**, not role membership alone.

The authorization contract evaluates:

```text
principal + action + resource type + resource context
  -> allow | deny (safe reason)
```

The decision process is:

1. Reject when there is no valid authentication context.
2. Reject when the internal account is deactivated or suspended.
3. Resolve the permission declared by the owning module for the requested
   action and resource type.
4. Confirm the principal has that permission through at least one active
   role.
5. Evaluate resource context supplied by the consuming module, such as the
   institution, ownership, academic scope, status, or record identifier.
6. Apply any deny-by-default policy or explicit restriction.
7. Return an allow decision only when every required condition passes.

Roles provide coarse capability; resource context prevents a capability such
as `student.update` from implying access to every student record. IAM evaluates
the authorization inputs and assigned permissions, but the consuming module
owns the meaning and safe acquisition of its resource context. IAM must not
query another module's tables or implement that module's business invariants.

All decisions deny by default. A caller cannot supply or override its own
roles, permissions, actor identifier, institution, or resource context.

## Permission declaration and consumption

Each consuming module declares its permissions as part of its application
contract and protects its use cases with an explicit IAM authorization call:

1. The module defines a stable permission identifier for an action/resource
   pair.
2. The module supplies the authenticated principal, action, resource type, and
   safe resource context to IAM.
3. IAM evaluates the principal's active roles and permissions plus the
   supplied context.
4. The module proceeds only after an allow decision.
5. The module remains responsible for validation, state transitions, business
   invariants, and its own data.

Modules must not import IAM repositories, read IAM tables, inspect role rows,
decode Cognito tokens, or create alternate authorization paths. Cross-module
authorization uses the application-owned contract defined by the IAM module.

## Role and permission lifecycle

### Creation and modification

Permissions are introduced by the owning module as reviewed, stable contract
identifiers. They are not arbitrary strings supplied by an administrator at
runtime. A permission may be retired only through an approved change that
preserves historical references.

Authorized IAM administrators may create and modify roles, including their
name, description, active status, and permission bundle. Modifications take
effect through an explicit operation and are audit-recorded. Removing a
permission from a role affects future decisions; historical audit records
retain the prior action and outcome.

### Assignment and revocation

An authorized IAM administrator may assign or revoke a role for a user.
Assignments and revocations are explicit, status-aware operations and are
audited with actor, target, role, outcome, reason, and correlation context.
Deactivating a role or permission prevents it from contributing to future
decisions without erasing historical records.

### Bootstrap authority

Before ordinary roles exist, access to IAM administration is bootstrapped
through a controlled **system administrator** authority established by an
explicit deployment or institutional provisioning process. It is not inferred
from a Cognito claim, first login, email address, or client-supplied value.

Bootstrap must be:

- a one-time or tightly controlled operation;
- restricted to an approved operational/provisioning boundary;
- attributable to an explicit actor or system actor;
- protected by the same authentication, audit, and least-privilege controls
  available at that stage;
- disabled or reduced once the initial administrator is established.

The exact provisioning mechanism belongs to IAM implementation and deployment
tasks, not this architecture specification.

## Privilege-escalation protection

Role and permission administration is itself permission-gated. A principal
may grant, revoke, or modify only permissions and roles within its delegated
administrative authority.

At minimum:

- an actor cannot assign a role whose effective permissions exceed the actor's
  own grant authority;
- an actor cannot grant a permission to itself or another principal in a way
  that creates a higher privilege level than the actor may delegate;
- changes to the system-administrator authority require the controlled
  bootstrap or a separately authorized break-glass process;
- role changes are checked against active account status and current
  authorization at the time of the operation;
- sensitive role creation, modification, and assignment may require
  separation of duties or a second approval where institutional policy
  requires it.

The policy must fail closed when delegation scope cannot be established.

## Denial and resource visibility

An authenticated principal without the required permission receives the
standard `FORBIDDEN` outcome with stable, minimal messaging and normally empty
details. The response must not reveal:

- whether a protected resource exists;
- the resource owner's identity or institution;
- which role or permission the caller lacks;
- internal policy rules or authorization queries;
- another principal's assignments.

Where revealing resource existence would violate the resource-visibility
policy, the consuming module/API boundary uses the approved concealed-resource
behavior, typically `NOT_FOUND`, rather than exposing a distinguishable
authorization result. IAM returns only a safe decision; it does not disclose
the policy evaluation internals.

## Authorization audit events

Authorization administration and security decisions use append-only audit
records owned by the audit/compliance capability. Required stable event names
include:

- `role_created`
- `role_modified`
- `role_deactivated`
- `role_assigned`
- `role_revoked`
- `permission_declared`
- `permission_granted`
- `permission_revoked`
- `permission_grouped`
- `authorization_allowed` where policy requires recording the decision
- `authorization_denied`
- `privilege_escalation_blocked`
- `bootstrap_administrator_established`

Each event records, as applicable:

- stable audit-record identifier;
- event name and `security` category;
- actor identity and actor type, or explicit system actor;
- target user, role, permission, resource type, or safe target reference;
- action and allow/deny or success/failure outcome;
- UTC occurrence and durable-record timestamps;
- request/process correlation ID;
- owning module (`identity-access`) and source boundary;
- safe reason, approval, delegation, or change reference;
- safe before/after role or permission state where required.

Audit records must never contain passwords, tokens, cookies, provider
credentials, private keys, raw provider errors, unrestricted request bodies,
or unnecessary personal data. Authorization denial records must not preserve
hidden resource identifiers or sensitive policy details.

## Audit coverage status

`permission_declared` is not applicable to the current implementation because
permissions are provided by a static registry rather than declared through a
runtime IAM operation. `permission_grouped` is also not applicable because
the current design has no permission-grouping model or grouping operation.
These event names remain reserved for a future design that introduces those
capabilities.

## Known Structural Risk

`AuthorizationService` is not currently the enforcement point for
`authorization_denied` auditing. The reviewed IAM application services emit
denial audit records at their calling boundary, while the shared
`AuthorizationService` evaluates policy and returns a decision without
writing an audit event.

Until a unified, audited authorization contract is deliberately designed,
future modules that call the shared authorization boundary must independently
ensure that authorization denials are audited with the required safe fields.
This responsibility is not currently guaranteed automatically by
`AuthorizationService`. Revisit this design before the Student Management or
Finance Management modules are implemented.

## Non-scope

This task does not define:

- IAM tables, columns, Prisma models, or migrations;
- concrete policy algorithms or implementation code;
- Fastify endpoints or transport schemas;
- consuming-module business rules;
- Cognito authentication or token verification.
