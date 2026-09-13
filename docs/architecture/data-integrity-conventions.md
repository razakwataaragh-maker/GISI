# GISI Data Integrity Conventions

## Purpose and scope

GISI uses PostgreSQL as the authoritative system of record. Database integrity
is enforced in the schema and migrations, not only in application code. These
conventions apply to every future Prisma model and migration; this foundation
task introduces no tables or business schema.

The rules support the SRS requirements for referential integrity, transactions,
constraints, indexes, historical preservation, and audit support.

## Table and migration ownership

- Each module owns the tables that represent its aggregate and owns the
  migrations that create or change those tables.
- A module must not write another module's tables directly.
- Cross-module references use explicit application contracts or approved
  read-only query contracts.
- Shared reference tables require an explicitly recorded owner and consumer
  contract.
- A migration may change another module's table only with that module owner's
  review and an explicit ownership record.
- Migration names use the deterministic UTC timestamp and snake-case convention
  defined in `database/migrations/README.md`.
- Applied migrations are immutable and all schema changes are version
  controlled.

## Referential integrity and foreign keys

- Every persisted relationship between rows must be represented by a PostgreSQL
  foreign key unless a documented boundary exception is approved.
- Foreign keys reference a primary key or an explicitly unique candidate key
  with compatible data types.
- Foreign-key columns are non-nullable when the relationship is mandatory and
  nullable only when the domain relationship is optional.
- Delete behavior is explicit for every foreign key. `CASCADE` is prohibited by
  default for historical or auditable records; `RESTRICT` or `NO ACTION` is
  preferred unless ownership and retention requirements justify another action.
- Updates to referenced identifiers are restricted unless the migration proves
  that historical references remain valid.
- Application checks do not replace database foreign keys.

## Constraints and valid state

- Every table has a primary key with a stable, non-secret identifier.
- Required values use `NOT NULL`; optionality must reflect a real domain rule.
- Enumerated state is constrained through a PostgreSQL/Prisma enum or a
  database check constraint when the set is intentionally closed.
- Amounts, counts, dates, and identifiers use types and bounds that prevent
  invalid values at the database boundary.
- Unique business identifiers have database-level unique constraints.
- Check constraints must reject impossible states, including invalid ranges,
  negative values where prohibited, and contradictory status fields.
- Constraints are named descriptively so failures can be diagnosed without
  exposing secrets.

## Indexes and query integrity

- Every primary key and unique constraint is indexed by PostgreSQL.
- Foreign-key columns used for joins, lookups, or deletion checks receive an
  index based on query evidence and review.
- Indexes must support documented access patterns rather than speculative
  duplication.
- Composite indexes follow the leading-column order of the supported query.
- Partial indexes are allowed when the predicate is stable and documented.
- Index changes are delivered through migrations and reviewed for write and
  deployment impact.

## Transactions and consistency

- Multi-row or multi-table state transitions execute inside an explicit
  transaction boundary.
- A transaction must preserve all relevant constraints before commit; partial
  business state is never considered successful.
- Transaction ownership belongs to the application/use-case boundary, not to
  controllers or database models.
- Retries are used only where the operation is safe and idempotent.
- Financial, activation, examination, results, certificate, and audit changes
  must preserve atomicity and historical traceability.

## Historical preservation

- Important lifecycle and decision records are append-only or versioned.
- Updates must not silently erase prior values needed for audit, reporting, or
  reconstruction of a decision.
- Hard deletion of historical records is prohibited unless an approved
  retention/legal policy explicitly requires it.
- Status changes preserve the actor, timestamp, reason, and prior state where
  the owning module requires those fields.
- Foreign-key delete rules must not orphan historical records.

## Audit storage boundary

- Audit records are owned by the audit/compliance capability, not by arbitrary
  business modules.
- Business modules emit an approved audit contract/event; they do not bypass
  the audit boundary with direct writes to audit tables.
- Audit records are append-only, attributable, timestamped, and linked to the
  affected aggregate without copying secrets.
- Audit payloads must exclude passwords, tokens, connection strings, and other
  credentials.
- Audit schema and retention policy are introduced by the dedicated audit task,
  not by this foundation convention task.

## Migration review and enforcement checklist

Every schema migration must demonstrate:

1. All relationships have explicit foreign keys or a documented exception.
2. Required fields, uniqueness, ranges, and state transitions have database
   constraints.
3. Foreign-key and access-pattern indexes are justified.
4. Ownership boundaries and cross-module references are documented.
5. Transactions preserve atomicity for affected use cases.
6. Historical and audit records cannot be silently lost.
7. Delete and update actions are explicit and safe.
8. The generated SQL is PostgreSQL-compatible and contains no credentials.
9. The migration is deterministic, reviewed, and safe for deployment.
10. The change does not introduce an unapproved module or business object.

CI validates Prisma schema syntax, generated client consistency, migration
consistency, and clean PostgreSQL migration application when PostgreSQL test
infrastructure is available. It must not substitute SQLite for PostgreSQL.
