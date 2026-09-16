# GISI Project Status

**Snapshot date:** 2026-09-16
**Current phase:** Phase 5, Application Management — complete and approved
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

Multiple `session.db` files can exist with identical row and dependency counts
but different, stale task statuses. Matching counts do **not** mean matching
data. Before trusting recovered backlog data, cross-check the statuses of the
most recently active tasks — currently
`implement-authentication`, `implement-user-management`,
`implement-roles-and-permissions`, and `implement-audit-writer` — against this
document's Completed tasks list, which is the durable ground truth. If a
`session.db` disagrees with this document, this document wins and the
`session.db` must be corrected to match, not the other way around. During
recovery, check file modification times first with
`ls -la --time-style=full-iso /home/wataara/.copilot/session-state/*/session.db`,
but always verify actual task statuses afterward; the newest file is not
guaranteed to be the most complete one.

Background or abandoned coding-agent sessions have produced significant
unreviewed, uncommitted work twice: exploratory IAM schema work, and a full
Student module plus server bootstrap layer. The latter was preserved in commits
`e4ad138` and `52a04e6` on the
`exploratory/unreviewed-student-and-bootstrap-work` branch. At the start of
every new session, run `git status` first to check for untracked or uncommitted
files that were never reviewed.

`PROJECT_STATUS.md` itself, committed to Git, is the true durable source of
truth for which tasks are complete. The session database is a convenient
working tool within one session, not the permanent record. If the two ever
disagree, `PROJECT_STATUS.md` and Git history govern.

## Backlog summary

The current backlog contains **75 total tasks: 70 done and 5 pending**.

## Phase 0 status

Project Foundation (Phase 0) is fully complete and approved.

## Phase 1 completed tasks

The following 13 of 13 Phase 1 tasks have been completed and independently verified, in order:

1. `define-iam-architecture` — `e7b8fc6`
2. `define-authentication-architecture` — `2e8c99c`
3. `define-authorization-architecture` — `4ea6458`
4. `define-iam-data-model` — `9b286ca`
5. `establish-iam-persistence` — `12ef7cd`
6. `implement-authentication` — `e64a686`
7. `implement-user-management` — `07cf480`
8. `implement-roles-and-permissions` — `0e25bd4`
9. `implement-iam-api-endpoints` — `fc6193c` (added missing auth endpoints)
10. `implement-iam-audit-logging` — already comprehensively implemented across all IAM services
11. `harden-iam-security-controls` — `42b43ef` (rate limiting, CORS, security headers, payload limits)
12. `add-iam-tests` — `23bb4f3` (domain layer tests to improve coverage)
13. `review-and-approve-iam` — `c92c0a5` (final review, TypeScript fixes, approval)

The separately tracked foundation task `implement-audit-writer` is also
complete in commit `10f8f42`. The latest corrective commits associated with
these completed tasks include `3aff673`, `12d927f`, `b2658ad`, and `91bab58`;
the task status remains governed by the completed-task list above and the
verified implementation history.

## Remaining Phase 1 tasks in dependency order

None - Phase 1 is complete and approved.

## Phase 2 completed tasks

The following 9 of 9 Phase 2 tasks have been completed and independently verified, in order:

1. `define-student-architecture` — `4c1e6bd` (student module structure, boundaries, dependencies)
2. `define-student-data-model` — `fec9860` (Prisma schema for students, history, documents)
3. `establish-student-persistence` — `fec9860` (StudentRepository with CRUD operations)
4. `implement-student-domain` — `fec9860` (status transitions, domain errors, business rules)
5. `implement-student-application` — `fec9860` (ManageStudents service with audit logging)
6. `implement-student-api` — `fec9860` (6 REST endpoints with /api/v1/students versioning)
7. `implement-student-audit-logging` — `fec9860` (comprehensive audit logging across operations)
8. `add-student-tests` — `40ae8a5` (27 domain tests for status transitions and errors)
9. `review-and-approve-student` — `6c9ffdd` (TypeScript fixes, final review, approval)

## Remaining Phase 2 tasks in dependency order

None - Phase 2 is complete and approved.

## Phase 3 completed tasks

The following 9 of 9 Phase 3 tasks have been completed and independently verified, in order:

1. `define-programme-architecture` — `4424dbe` (programme module structure, boundaries, dependencies)
2. `define-programme-data-model` — `7a7ad76` (Prisma schema for programmes, versions, history)
3. `establish-programme-persistence` — `7a7ad76` (ProgrammeRepository with CRUD operations)
4. `implement-programme-domain` — `7a7ad76` (status transitions, domain errors, business rules)
5. `implement-programme-application` — `7a7ad76` (ManageProgrammes service with audit logging)
6. `implement-programme-api` — `7a7ad76` (5 REST endpoints with /api/v1/programmes versioning)
7. `implement-programme-audit-logging` — `7a7ad76` (comprehensive audit logging across operations)
8. `add-programme-tests` — `7a7ad76` (26 domain tests for status transitions and errors)
9. `review-and-approve-programme` — Final review and approval

## Remaining Phase 3 tasks in dependency order

None - Phase 3 is complete and approved.

## Phase 4 completed tasks

The following 9 of 9 Phase 4 tasks have been completed and independently verified, in order:

1. `define-session-architecture` — `1fa7515` (session module structure, boundaries, dependencies)
2. `define-session-data-model` — `6017fd2` (Prisma schema for sessions, history, windows)
3. `establish-session-persistence` — `6017fd2` (SessionRepository with CRUD operations)
4. `implement-session-domain` — `6017fd2` (status transitions, domain errors, business rules)
5. `implement-session-application` — `6017fd2` (ManageSessions service with audit logging)
6. `implement-session-api` — `6017fd2` (6 REST endpoints with /api/v1/sessions versioning)
7. `implement-session-audit-logging` — `6017fd2` (comprehensive audit logging across operations)
8. `add-session-tests` — `6017fd2` (39 domain tests for status transitions and errors)
9. `review-and-approve-session` — Final review and approval

## Remaining Phase 4 tasks in dependency order

None - Phase 4 is complete and approved.

## Phase 5 completed tasks

The following 9 of 9 Phase 5 tasks have been completed and independently verified, in order:

1. `define-application-architecture` — `1dd5f75` (application module structure, boundaries, dependencies)
2. `define-application-data-model` — `f39f643` (Prisma schema for applications, history, documents)
3. `establish-application-persistence` — `f39f643` (ApplicationRepository with CRUD operations)
4. `implement-application-domain` — `f39f643` (status transitions, domain errors, business rules)
5. `implement-application-application` — `f39f643` (ManageApplications service with audit logging)
6. `implement-application-api` — `f39f643` (12 REST endpoints with /api/v1/applications versioning)
7. `implement-application-audit-logging` — `f39f643` (comprehensive audit logging across operations)
8. `add-application-tests` — `f39f643` (98 domain tests for status transitions and errors)
9. `review-and-approve-application` — Final review and approval

## Remaining Phase 5 tasks in dependency order

None - Phase 5 is complete and approved.

## Known incident

A migration-integrity violation occurred and was remediated by regenerating the
local migration history from the Prisma schema. It is resolved, not open. See
the incident note in `docs/architecture/database-migrations.md` and commits
`459f2f9` and `e877d1d` for details.

## Resolved issue

A database-level safeguard preventing Finance Officer roles from ever being
granted Activation-domain permissions was designed and approved during
`implement-roles-and-permissions` Stage 1, but was absent from the schema and
migrations. This has been resolved by:

1. Adding the missing `rank` field to the Role model in Prisma schema
2. Adding the missing BootstrapControl model to Prisma schema
3. Creating migration `20260916100000_add_iam_domain_safeguards` with:
   - Rank field addition with index
   - BootstrapControl table creation
   - Database trigger enforcing Finance Officer restriction
4. Adding integration tests for the safeguards
5. Updating documentation in `docs/architecture/iam-data-model.md`

The safeguard now prevents Finance Officer roles from being granted
Activation-domain permissions through a database trigger, enforcing the
business rule that Finance determines eligibility but does not activate students.

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
