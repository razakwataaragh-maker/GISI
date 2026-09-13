# GISI Database Migration Architecture

## Scope

GISI uses Prisma Migrate against PostgreSQL. The Prisma datasource remains in
`prisma/schema.prisma` and reads `DATABASE_URL`; migration execution does not
introduce a second configuration path or a SQLite substitute.

No migration artifact is created by this foundation task. The schema contains
only the PostgreSQL datasource and Prisma client generator, so Prisma correctly
has no schema delta to migrate. Inventing a table solely to create an initial
migration would violate the modular delivery order and introduce unauthorized
business schema.

Prisma's executable migration artifacts belong in `prisma/migrations/`, while
`database/migrations/` is the repository's migration governance and operational
documentation directory. The two locations must not contain duplicate artifacts.

## Ordering and ownership

Migration directories use UTC timestamp plus descriptive snake-case names. The
timestamp gives deterministic ordering; the description identifies one coherent
change. Applied migrations are immutable and version-controlled. The task or
module owner that introduces a schema change owns its migration, generated SQL
review, PostgreSQL compatibility, and rollback/forward-fix assessment.

## Environment workflows

- **Local:** validate and generate the client, create migrations only against
  isolated PostgreSQL using `prisma migrate dev`, review SQL, then commit the
  migration.
- **CI:** validate the schema, generate the client, apply the committed set to a
  clean PostgreSQL database with `prisma migrate deploy`, and check drift where
  infrastructure permits.
- **Staging:** apply the committed set with `prisma migrate deploy` using
  deployment-managed `DATABASE_URL`; observe and fail the deployment on error.
- **Production:** use the same deploy command in an approved, observable release
  step after migration review and backup/recovery checks.

Schema changes must precede application code that requires them. Destructive
changes require explicit review. Manual changes to shared, staging, or
production schemas are prohibited.

All schema changes must also satisfy
`data-integrity-conventions.md`, including explicit foreign keys, constraints,
justified indexes, module table ownership, transaction boundaries, historical
preservation, and the audit storage boundary.

## Rollback policy

Prisma does not provide an automatic universal rollback for applied migrations.
Reversible changes may use a tested reverse operation. Production failures
normally require a new forward-fix migration. Destructive changes require
explicit approval, backups, and a documented recovery plan; an automatic reset
is never a production recovery strategy.

## Validation

The foundation exposes these repository commands:

```bash
npm run prisma:validate
npm run prisma:generate
npm run db:migrate:status
npm run db:migrate:deploy
```

`db:migrate:status` and `db:migrate:deploy` require a reachable PostgreSQL
database and a secret supplied through `DATABASE_URL`. No live PostgreSQL
infrastructure is currently provisioned in this repository, so live migration
application and drift checks are deferred rather than fabricated. Schema
validation, client generation, and empty-diff checks remain runnable locally.

## Migration integrity incident

On 2026-09-13, the solo local development database was reset and the IAM
assignment-history migration and its dependent audit migration were regenerated
from `prisma/schema.prisma` after hand-touched SQL caused a migration-integrity
violation. The regenerated migrations were applied to a clean local PostgreSQL
database and verified with `prisma migrate status` and PostgreSQL schema
inspection.

This is a recorded example of what not to do: migration SQL and Prisma migration
checksums must never be edited manually, and checksum overrides or manual `psql`
changes must not be used to bypass Prisma integrity checks. For shared,
staging, or production databases, use a reviewed forward-fix migration instead
of resetting history.
