# GISI Identity & Access Management Data Model

- **Status:** Implemented for Phase 1 persistence baseline
- **Scope:** PostgreSQL/Prisma model for IAM persistence
- **Governing architecture:** [IAM architecture](identity-access-management.md),
  [authentication architecture](authentication-architecture.md), and
  [authorization architecture](authorization-architecture.md)

## Purpose and boundary

This document defines the entities, relationships, constraints, and access
patterns required by the IAM module. The Prisma schema and migration implement
this model; application behavior remains out of scope.

All tables described here are owned exclusively by
`src/modules/identity-access/`. Other modules consume IAM through application
contracts and must not read or write these tables directly. Audit records
remain owned by the separate audit/compliance capability.

## User entity

The internal user represents a pre-provisioned GISI identity mapped to an
external Cognito subject. It is not a credential store.

Conceptual fields:

- stable non-secret primary identifier;
- unique Cognito subject identifier;
- account status with the closed set `active`, `deactivated`, and `suspended`;
- display and institutional identity attributes required by IAM and approved
  user-management workflows;
- `createdAt`;
- `updatedAt`;
- `activatedAt` or equivalent status-transition timestamp when applicable;
- `deactivatedAt` when applicable;
- `suspendedAt` when applicable;
- `statusChangedAt`;
- stable reference to the actor or system process that performed the latest
  status change;
- status-change reason or approved change reference where required.

The Cognito subject is an opaque, non-secret provider identifier. The user
entity must not store passwords, password hashes, access tokens, refresh
tokens, cookies, Cognito session contents, client secrets, or provider
credentials. Provider-specific profile data is not copied unless a later
approved requirement establishes ownership and retention.

One Cognito subject maps to at most one internal user. A user cannot become
active merely because a Cognito subject exists; provisioning and status
management remain explicit institutional operations.

## Role entity

A role is a named, lifecycle-managed bundle of permissions representing an
institutional responsibility.

Conceptual fields:

- stable non-secret primary identifier;
- unique stable role key;
- human-readable name and safe description;
- lifecycle status, including active and inactive/deactivated;
- `createdAt` and `updatedAt`;
- creation and last-modification actor references;
- deactivation timestamp, actor, and reason where applicable;
- optional version or change reference when role definitions are revised.

Deactivation prevents the role from contributing to new authorization
decisions. Historical assignments and audit references remain intact.

## Permission entity and declaration registry

A permission is a stable capability identified by an owning module, action,
and resource type. It is not a user attribute and does not contain Cognito
claims.

### Decision: code-level permission registry

Permission declarations are owned in a reviewed code-level registry or
module-owned contract, not created as arbitrary administrator-defined database
rows. The registry supplies:

- stable permission identifier;
- owning module;
- action;
- resource type;
- concise description;
- lifecycle/deprecation metadata where needed.

The database may later persist references to these stable identifiers for role
bundles and audit history, but the declaration authority remains code and
version control. This prevents misspelled or orphaned runtime capabilities,
ensures permissions evolve with the module that owns the resource, and makes
permission changes reviewable and deployable. A permission is retired by
deprecation and migration policy, not by deleting history.

If a later requirement needs dynamic institutional policy metadata, it must be
introduced through a separate approved decision; it must not turn permission
identifiers into unconstrained runtime input.

## Role-permission relationship

Roles and permissions have a many-to-many relationship represented by a
historically preserved role-permission assignment concept.

Conceptual fields:

- stable assignment identifier;
- role reference;
- stable permission identifier from the owning module registry;
- active/revoked status;
- `assignedAt`;
- assigning actor or system-process reference;
- assignment reason;
- `revokedAt`, revoking actor, and revocation reason where applicable;
- created/updated timestamps and approved change reference where required.

The relationship must preserve prior grants and revocations. Removing a
permission from a role deactivates or revokes the relationship for future
decisions; it does not physically delete the historical assignment.

## User-role assignment

The user-role assignment records which internal user held which role and the
authority that established or removed that assignment.

Conceptual fields:

- stable assignment identifier;
- user reference;
- role reference;
- assignment status, including active and revoked;
- `assignedAt`;
- assigning actor or explicit system actor;
- `revokedAt` when revoked;
- revoking actor or explicit system actor when revoked;
- assignment reason and revocation reason where applicable;
- created/updated timestamps;
- approved change or delegation reference where applicable.

An assignment is never physically deleted as part of ordinary revocation.
Repeated assignment after revocation creates a new historical assignment
period or an explicitly versioned successor; it must not erase the prior
actor, timestamp, or reason.

## Bootstrap administrator representation

The bootstrap system-administrator authority is not represented by a default
user, a default password, an automatically active role assignment, a Cognito
claim, an email address, or a first-login rule.

The data model represents ordinary administrator authority through the same
role and user-role assignment concepts as every other role. The initial
administrator assignment must be created by a controlled provisioning
operation that:

- targets an explicitly identified, pre-provisioned internal user;
- records an explicit system or approved operational actor;
- records the bootstrap operation, time, reason, and change reference;
- is idempotent and cannot silently assign authority to an arbitrary
  first-seen Cognito subject;
- leaves a durable historical record of the bootstrap assignment.

Until that controlled operation succeeds, no ordinary user has IAM
administration authority. If a separate bootstrap-state record or deployment
marker is needed to make the operation one-time, it is an operational
control owned by IAM and must itself be protected, auditable, and unable to
grant access without an explicit user-role assignment. No insecure default
administrator row is seeded.

## Constraints

The eventual PostgreSQL schema and migration must enforce, at minimum:

- a stable primary key on every entity and relationship table;
- `NOT NULL` on all required identifiers, statuses, timestamps, and mandatory
  foreign-key columns;
- a closed status constraint for user, role, role-permission, and user-role
  lifecycle states;
- a unique Cognito subject mapping so one subject cannot map to multiple
  internal users;
- a unique stable role key;
- at most one active role-permission relationship for a role and permission,
  while allowing historical revoked relationships to remain preserved;
- explicit foreign keys from assignments to their owned user, role, and
  permission references;
- restricted/no-action deletion behavior for historical and auditable rows;
- no cascade that silently removes assignment or status history;
- consistency checks such as `revokedAt` requiring revoked status and
  assignment actor/timestamp being present;
- immutable or append-preserving identity references used by audit records.

Permission identifiers stored in role relationships must be validated against
the code-level registry during application startup, migration review, or an
explicit registry synchronization step. Unknown identifiers must not silently
authorize.

## Indexes and access patterns

The migration design must justify indexes for these expected queries:

- unique lookup of a user by Cognito subject on every authenticated request;
- lookup of an internal user by stable primary identifier;
- active-account status lookup for a mapped principal;
- active role assignments for a user;
- active permissions for a role;
- role-permission lookup by role and permission;
- historical assignment queries by user, role, actor, and time;
- status-transition and audit-reference queries where operational workflows
  require them.

The Cognito-subject unique constraint supplies the primary subject lookup
index. Composite indexes should lead with the equality-filtered foreign key
and status used by active authorization queries. Historical indexes must not
replace the constraints that preserve history.

## Transactions and lifecycle consistency

The application/use-case boundary owns transactions for multi-entity changes:

- provisioning or mapping a user;
- assigning or revoking a role;
- adding or revoking a permission from a role;
- changing account status;
- establishing the initial administrator assignment.

Each successful transition must preserve the IAM state and emit the required
audit event through the separate audit contract according to its transaction
policy. Partial role changes or assignments are not successful state.

## Ownership and audit separation

IAM operational data includes users, roles, permission references, assignments,
statuses, and lifecycle metadata. It is owned and migrated only by the
identity-access module.

Audit records are not IAM tables. IAM emits approved audit events containing
safe actor, target, outcome, timestamps, correlation, and change context.
Passwords, tokens, provider credentials, connection strings, raw provider
errors, and unrestricted payloads are excluded from both IAM operational
records and audit events.

## Explicit non-scope

This task does not define:

- authentication or authorization implementation;
- HTTP endpoints;
- the separate audit-record schema;
- Student, Finance, or other module data.

## Persistence implementation

The approved model is implemented in `prisma/schema.prisma` and the
`establish_iam_persistence` migration. The implementation uses UUID primary
keys for internal entities and a text primary key for the permission reference,
matching the stable code-level permission identifier. User, role,
role-permission, and user-role assignment lifecycle states are PostgreSQL enum
types. All assignment foreign keys use `RESTRICT` for delete and update
behavior, preserving historical rows.

The implementation intentionally uses the approved minimal User shape:
identity mapping, account status, lifecycle timestamps, status-change actor,
and status-change reason. Display and institutional identity attributes remain
deferred until a user-management workflow approves their ownership and fields.
