# GISI Database Migration Foundation

This directory is the reviewed migration workspace for GISI. The current
datasource-only Prisma schema intentionally has no migration files and creates
no database objects. Do not add an empty or invented foundation migration.

Prisma's migration engine uses the schema at `prisma/schema.prisma` and its
canonical generated migration directory at `prisma/migrations/`. This directory
holds the migration conventions, review records, and operational guidance that
govern those version-controlled artifacts. Future migration artifacts must be
placed in `prisma/migrations/` using the workflow below; `database/migrations/`
must not contain duplicate copies.

## Conventions

- Migration directories use a deterministic UTC timestamp followed by a
  descriptive snake-case name:
  `YYYYMMDDHHMMSS_add_student_identity`.
- Each migration is committed with its generated `migration.sql` and reviewed
  as immutable history.
- The migration author owns correctness, PostgreSQL compatibility, and a
  rollback or forward-fix assessment.
- Migration names describe one coherent schema change and must not contain
  credentials or environment-specific values.
- Business schema is introduced only by the task that owns that business
  module.
- Data integrity requirements for foreign keys, constraints, indexes,
  transactions, historical preservation, audit boundaries, and ownership are
  defined in `docs/architecture/data-integrity-conventions.md`.

## Local creation and application

Use Node.js 22 and a PostgreSQL development database supplied through
`DATABASE_URL`:

```bash
npm run prisma:validate
npm run prisma:generate
npx prisma migrate dev --name add_<descriptive_change>
```

Review the generated SQL before committing it. Apply committed migrations to a
local database with:

```bash
npm run db:migrate:deploy
```

Never use SQLite as a substitute. Local test databases must be isolated,
disposable PostgreSQL databases with deterministic names and credentials supplied
outside committed files.

Before approval, use the data-integrity checklist in
`docs/architecture/data-integrity-conventions.md` to verify foreign keys,
constraints, indexes, ownership, historical preservation, and audit boundaries.

## CI, staging, and production

CI must:

1. Run `npm ci`.
2. Run `npm run prisma:validate`.
3. Run `npm run prisma:generate`.
4. Apply all committed migrations to a clean PostgreSQL database with
   `npm run db:migrate:deploy`.
5. Run schema drift checks where a PostgreSQL database is available.
6. Run tests against PostgreSQL when the test suite requires persistence.

Staging applies the exact committed migration set using
`npm run db:migrate:deploy` and deployment-managed `DATABASE_URL`. Production
uses the same command and requires an observable deployment step with controlled
access to the managed PostgreSQL endpoint.

Migrations are reviewed before deployment. A failed migration stops the
deployment. Schema changes must be deployed before application code that
requires them. Destructive changes require explicit architecture/data-owner
review. Shared, staging, and production schemas must not be modified manually.

## Rollback and safety

Prisma does not automatically roll back every migration. Before deployment,
classify each migration:

- **Safely reversible:** a tested reverse operation exists and can be run
  without losing data.
- **Forward-fix:** the migration is corrected by a new additive migration; this
  is the default for production failures.
- **Destructive:** data or structure is removed or made unrecoverable; it
  requires explicit approval, backups, and a documented recovery plan.

Do not edit an applied migration. Do not reset a shared database to recover from
a failed production deployment. Diagnose the failure and use a reviewed
forward-fix or approved operational recovery procedure.

## Validation and secrets

`DATABASE_URL` is read by Prisma from the existing configuration boundary. It
must be supplied by the shell, CI secret store, or deployment secret manager.
It must never appear in migration SQL, committed configuration, logs, errors, or
documentation. Migration output and deployment logs must be reviewed for
accidental secret disclosure.
