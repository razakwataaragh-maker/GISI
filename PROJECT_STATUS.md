# GISI Project Status

**Snapshot date:** 2026-09-13  
**Current phase:** Phase 1, Identity & Access Management — in progress
**Source of backlog state:** `todos` and `todo_deps` tables

This file is a point-in-time handoff snapshot. The `todos` table remains the
authoritative backlog and this file must not be treated as a replacement for
it.

## Backlog Storage Warning

The `todos` and `todo_deps` tables are stored in a SQLite database local to each
Copilot session at
`~/.copilot/session-state/<session-id>/session.db`. They are not stored in the
GISI Git repository and are not shared automatically between sessions.

If a new session's eligible-task query unexpectedly returns zero rows, this does
**not** mean the backlog is actually empty. Check for an existing populated
`session.db` from a prior session before assuming data loss.

The recovery procedure used on 2026-09-13 was to locate the prior session
database by searching `~/.copilot/session-state/*/session.db` for one containing
populated `todos` and `todo_deps` tables, read all source rows read-only, and
insert them into the new session's own tables using explicit `BEGIN`/`COMMIT`
transactions. The `id`, `status`, and timestamps were preserved exactly; no
statuses were reset.

`PROJECT_STATUS.md` itself, committed to Git, is the true durable source of
truth for which tasks are complete. The session database is a convenient
working tool within one session, not the permanent record. If the two ever
disagree, `PROJECT_STATUS.md` and Git history govern.

## Backlog summary

The current backlog contains **39 total tasks: 31 done and 8 pending**.

## Phase 0 status

Project Foundation (Phase 0) is fully complete and approved.

## Phase 1 completed tasks

The following Phase 1 tasks have been completed, in order:

1. `define-iam-architecture`
2. `define-authentication-architecture`
3. `define-authorization-architecture`
4. `define-iam-data-model`
5. `establish-iam-persistence`
6. `implement-audit-writer`

`implement-audit-writer` was implemented and committed, but has **not** received
final independent review/sign-off from the reviewing AI. The reviewer was
reading the raw contents of
`src/modules/audit/domain/audit-writer.ts`,
`src/modules/audit/application/validate-audit-event.ts`,
`src/modules/audit/infrastructure/prisma-audit-writer.ts`,
`tests/unit/audit-writer.test.ts`, and
`prisma/migrations/20260913190522_preserve_iam_history_and_audit/migration.sql`
when the session ended. The next reviewing AI must read these files directly and
complete that review before treating this task as fully verified, even though it
is marked `done` in the `todos` table.

## Remaining Phase 1 tasks in dependency order

The eight pending Phase 1 tasks are:

1. `implement-authentication`
2. `implement-user-management`
3. `implement-roles-and-permissions`
4. `harden-iam-security-controls`
5. `implement-iam-api-endpoints`
6. `implement-iam-audit-logging`
7. `add-iam-tests`
8. `review-and-approve-iam`

## Known incident

A migration-integrity violation occurred and was remediated by regenerating the
local migration history from the Prisma schema. It is resolved, not open. See
the incident note in `docs/architecture/database-migrations.md` and commits
`459f2f9` and `e877d1d` for details.

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

- A working local PostgreSQL database now exists through
  `deploy/local/compose.yml`. Use Docker Compose (`docker compose`), not Podman:
  the container-tool configuration defaults to Podman, but Podman is not
  installed on this host. Docker must be used every time for this local service.
- `buildIdentity` from the version endpoint is currently the intentional
  placeholder `name@version`, pending real Git SHA or CI build metadata.

## Instructions for continuing

1. Run the standard eligible-task query and confirm the next task from the
   actual `todos` and `todo_deps` tables:

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
3. Always obtain raw `cat`, `git`, and test output; never trust a summary of
   file contents.
4. Verify migrations are generated only by Prisma itself and are never
   hand-edited; see the migration incident note for why.
5. Commit the completed task in its own commit.
6. Mark only that task `done` after acceptance criteria and validation are
   satisfied, then stop.

All decisions and architecture live in `docs/`, especially
`docs/decisions/` and `docs/architecture/`. The `todos` table is the
authoritative backlog; this file is only a handoff snapshot and must not
override live task status or dependencies.
