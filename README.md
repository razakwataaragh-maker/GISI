# GISI

GISI is a Student Management and Academic Administration Platform for the
complete student lifecycle, from application and admission through registration,
learning, examination, progression, and certification.

## Current phase

GISI is completing **001-project-foundation**, Version 1.0 Phase 0. The
foundation establishes the modular-monolith boundaries, PostgreSQL and Prisma
baseline, configuration and logging boundaries, API contracts, testing
harness, security baseline, and continuous integration/delivery
documentation. Business modules are implemented in the order defined by the
[master SRS](GISI-MASTER-SRS.md).

The authoritative handoff snapshot is
[PROJECT_STATUS.md](PROJECT_STATUS.md). The backlog itself is maintained in
the session `todos` and `todo_deps` tables.

## Local setup

Use the approved [local development environment guide](docs/development/local-development-environment.md)
for prerequisites, installation, environment variables, PostgreSQL setup,
bootstrap, and troubleshooting. The supporting [Ubuntu prerequisites](docs/development/ubuntu-prerequisites.md),
[bootstrap workflow](docs/development/bootstrap-workflow.md), and
[database initialization](docs/development/database-initialization.md)
documents provide platform-specific detail.

The project requires Node.js 22 and PostgreSQL. Do not commit secrets or local
environment files, and do not substitute SQLite for PostgreSQL.

## Common commands

Install locked dependencies:

```text
npm ci
```

Run quality checks:

```text
npm run format:check
npm run lint
npm run typecheck
```

Run tests and coverage:

```text
npm test
npm run test:coverage
```

Validate and generate Prisma artifacts:

```text
npm run prisma:validate
npm run prisma:generate
```

The complete command set and environment requirements are maintained in the
[development documentation index](docs/development/index.md).

## Documentation

- [Architecture documentation](docs/architecture/index.md) describes runtime
  boundaries and operational architecture.
- [API documentation](docs/api/index.md) describes HTTP contracts, errors,
  middleware, and API ownership.
- [Architecture decision records](docs/decisions/index.md) record accepted
  technology and architectural decisions.
- [Development documentation](docs/development/index.md) covers local setup,
  coding, testing, dependencies, and repository standards.
- [Project status and backlog snapshot](PROJECT_STATUS.md) records completed
  and pending foundation work.

## Foundation documentation findings

The following gaps were identified during the foundation documentation review
and are intentionally recorded here rather than silently changing accepted
documents:

1. `docs/development/testing-harness.md` still says Prisma migration
   application and live database validation are deferred. CI now performs
   migration checks and integration tests against a temporary PostgreSQL
   service; persistent local, staging, and production databases remain
   unprovisioned. The testing guide should be reconciled in a follow-up
   documentation change.
2. `docs/development/local-development-environment.md` says application
   scripts and configuration files are future implementation work, but the
   repository now contains the documented npm quality, test, and Prisma
   commands and typed configuration. This wording should be reconciled in a
   follow-up documentation change.
3. The repository has foundation HTTP endpoint implementations and contract
   tests, but no generated OpenAPI specification or production deployment
   entry point yet. The existing API ownership and continuous-delivery
   documents already identify these as future implementation boundaries.

These findings do not introduce or revise an architectural decision.
