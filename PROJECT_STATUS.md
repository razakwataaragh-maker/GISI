# GISI Project Status

**Snapshot date:** 2026-09-13  
**Current phase:** `001-project-foundation` — Version 1.0, Phase 0  
**Source of backlog state:** `todos` and `todo_deps` tables

This file is a point-in-time handoff snapshot. The `todos` table remains the
authoritative backlog and this file must not be treated as a replacement for
it.

## Completed tasks

The following tasks are currently marked `done` in the `todos` table:

1. `establish-repository-layout` — Established the approved repository
   structure for source, modules, infrastructure, database, deployment,
   scripts, tests, and documentation.
2. `select-and-record-technology-baseline` — Recorded the approved runtime,
   language, API framework, database tooling, test runner, package manager, and
   infrastructure-as-code baseline.
3. `configure-dependency-management` — Established dependency manifests,
   lockfile policy, runtime policy, and reproducible installation commands.
4. `configure-development-quality-tools` — Implemented and installed ESLint,
   Prettier, `.editorconfig`, and the `lint`, `format`, `format:check`, and
   `typecheck` npm scripts; all quality checks pass as of commit
   `93410e3ba8fe65e1f318cc710ffe16c443f8c259`.
5. `document-local-development-environment` — Documented prerequisites,
   setup, local services, database bootstrap, commands, and troubleshooting.
6. `define-application-composition` — Defined the composition root, dependency
   registration, lifecycle ownership, and graceful startup/shutdown design.
7. `define-api-foundation` — Defined versioned REST API conventions, JSON
   rules, OpenAPI ownership, middleware ordering, and routing boundaries.
8. `implement-configuration-management` — Implemented typed configuration
   categories, validation, safe defaults, precedence, and environment
   boundaries without committing secrets.
9. `establish-postgresql-connectivity` — Established PostgreSQL connection
   lifecycle, pooling, readiness, transaction boundaries, and environment
   access.
10. `establish-database-migrations` — Defined migration ownership, naming,
    execution, rollback, validation, local bootstrap, seeds, and CI checks.
11. `define-data-integrity-conventions` — Defined database constraints,
    foreign keys, indexes, historical preservation, audit storage, and table
    ownership conventions.
12. `implement-structured-logging` — Implemented structured logging with
    severity, context, environment/version fields, and sensitive-data
    redaction.
13. `implement-correlation-identifiers` — Implemented correlation ID
    propagation through requests, logs, response headers, and error responses.
14. `define-error-taxonomy` — Defined stable categories and codes for
    validation, access, resource, business, dependency, persistence, and
    unexpected errors.
15. `implement-api-error-boundary` — Implemented centralized error
    translation, status mapping, safe responses, validation details,
    correlation IDs, and diagnostic logging.
16. `implement-health-endpoints` — Implemented dependency-free liveness and
    PostgreSQL-backed readiness endpoints with safe responses.
17. `implement-version-endpoint` — Implemented the public version endpoint
    using controlled application metadata.
18. `establish-test-harness` — Established independent deterministic test
    suites and V8 coverage reporting with forward-looking layer thresholds.
19. `add-foundation-tests` — Added foundation coverage for configuration,
    database lifecycle, health/readiness, version, logging redaction, error
    contracts, and architecture boundaries.
20. `establish-security-baseline` — Defined secrets handling, TLS, secure
    headers, CORS, rate limiting, dependency scanning, validation, and
    authentication/authorization boundaries.
21. `define-audit-boundary` — Defined immutable audit records, event
    categories, ownership, retention, safe fields, and separation from
    operational logs.

## Remaining tasks in dependency order

These are the four tasks currently marked `pending`. Their dependency order is
determined from `todo_deps`; do not begin a task until the standard eligible
task query identifies it.

1. `configure-continuous-integration` — Create CI checks for installation,
   formatting, linting, type checking, tests, migrations, architecture rules,
   security scans, secret scans, and artifacts.
   - Depends on: `add-foundation-tests` (`done`) and
     `establish-security-baseline` (`done`).
2. `define-continuous-delivery` — Define immutable artifacts, environment
   promotion, approvals, configuration injection, migration sequencing,
   health verification, rollback, and AWS deployment boundaries.
   - Depends on: `configure-continuous-integration` (`pending`).
3. `complete-foundation-documentation` — Complete README and architecture,
   API, configuration, database, logging, testing, security, CI/CD,
   deployment, rollback, backup, and recovery documentation.
   - Depends on: `define-audit-boundary` (`done`),
     `document-local-development-environment` (`done`), and
     `define-continuous-delivery` (`pending`).
4. `review-and-approve-foundation` — Run the foundation checklist,
   architecture and security reviews, acceptance verification, risk review,
   and the readiness gate for Identity and Access Management.
   - Depends on: `configure-continuous-integration` (`pending`) and
     `complete-foundation-documentation` (`pending`).

## Key architectural decisions

The binding decisions and architecture documentation live under `docs/`.
Key decisions recorded in `docs/decisions/` include:

- [0001-technology-baseline.md](docs/decisions/0001-technology-baseline.md)
  — baseline technology choices.
- [0002-backend-language-and-runtime.md](docs/decisions/0002-backend-language-and-runtime.md)
  — Node.js and TypeScript runtime policy.
- [0003-api-framework.md](docs/decisions/0003-api-framework.md) — Fastify
  as the API framework.
- [0004-database-and-orm.md](docs/decisions/0004-database-and-orm.md) —
  PostgreSQL and Prisma at the infrastructure boundary.
- [0005-authentication.md](docs/decisions/0005-authentication.md) —
  authentication provider isolation and future Cognito integration boundary.
- [0006-logging.md](docs/decisions/0006-logging.md) — structured logging,
  context, and redaction.
- [0007-testing.md](docs/decisions/0007-testing.md) — Vitest, deterministic
  tests, and gated PostgreSQL integration testing.
- [0010-ci-cd.md](docs/decisions/0010-ci-cd.md) — CI/CD foundation direction.
- [0011-cloud-strategy.md](docs/decisions/0011-cloud-strategy.md) — AWS as
  the initial cloud target with cloud-portable boundaries.
- [0012-dependency-management.md](docs/decisions/0012-dependency-management.md)
  — dependency and lockfile governance.
- [0014-application-composition.md](docs/decisions/0014-application-composition.md)
  — composition root and lifecycle ownership.
- [0015-api-foundation.md](docs/decisions/0015-api-foundation.md) — public
  API foundation and routing conventions.
- [0016-api-error-taxonomy.md](docs/decisions/0016-api-error-taxonomy.md) —
  stable API error codes and response contract.
- [0017-audit-boundary.md](docs/decisions/0017-audit-boundary.md) —
  immutable audit records and their boundary from operational logs.
- [0018-security-baseline.md](docs/decisions/0018-security-baseline.md) —
  security baseline requirements.

The system is being built as a modular monolith with the dependency direction
`Frontend → API → Application → Domain → Infrastructure Interfaces →
Infrastructure Implementations`. PostgreSQL is mandatory for the primary
database, and AWS is the initial cloud target.

## Known deferred items

- No live PostgreSQL instance has been provisioned yet. Integration tests and
  live migration checks remain explicitly deferred; they must not be
  fabricated or replaced with SQLite.
- `buildIdentity` from the version endpoint is currently the intentional
  placeholder `name@version`, pending real Git SHA or CI build metadata.

## Instructions for continuing

1. Run the standard eligible-task query:

   ```sql
   SELECT t.id, t.title, t.status FROM todos t
   WHERE t.status = 'pending'
   AND NOT EXISTS (
     SELECT 1
     FROM todo_deps d
     JOIN todos dep ON dep.id = d.depends_on
     WHERE d.todo_id = t.id
       AND dep.status != 'done'
   )
   ORDER BY t.created_at ASC
   LIMIT 1;
   ```

2. Implement **only** the task returned by that query.
3. Verify the work with real command output, not summaries.
4. Commit the completed task in its own commit.
5. Mark only that task `done` after acceptance criteria and validation are
   satisfied, then stop.

All decisions and architecture live in `docs/`, especially
`docs/decisions/` and `docs/architecture/`. The `todos` table is the
authoritative backlog; this file is only a handoff snapshot and must not
override live task status or dependencies.
