# GISI PostgreSQL Connectivity Architecture

## Boundary

`DatabaseConnection` is the application-facing lifecycle and readiness contract in
`src/infrastructure/database/database-connection.ts`. The composition root injects
this contract; application and domain code never imports Prisma, Prisma-generated
types, or database connection environment variables.

`PrismaDatabaseConnection` is the replaceable PostgreSQL implementation. Prisma
types and client methods are confined to this infrastructure file. A future
repository may depend on an application-owned persistence contract without
exposing Prisma types.

## Client and lifecycle

One Prisma client is created for the process. Startup calls `connect()` before the
application can report ready. Readiness executes a constant `SELECT 1` query and
returns a redacted boolean result. Shutdown calls `disconnect()` after traffic and
module resources have drained; disconnect is safe to call when the client was
never connected.

Connection failures are translated to `DatabaseConnectionError`. The public
message contains no URL, username, password, host, or provider error text, and
the provider error is deliberately not retained on the thrown error. Readiness
failures return `ready: false` and never expose provider details.

## Pool defaults

The adapter applies safe PostgreSQL/Prisma URL parameters unless explicitly
overridden by its typed options:

| Option                  | Default |
| ----------------------- | ------: |
| `connectionLimit`       |      10 |
| `poolTimeoutSeconds`    |      10 |
| `connectTimeoutSeconds` |      10 |

The connection URL is supplied by the validated `ApplicationConfiguration`
database boundary. The URL is a secret whenever it contains credentials and is
never logged or included in errors.

## Prisma version decision

The current dependency decision is:

- `@prisma/client`: `6.12.0` (resolved in `package-lock.json`)
- `prisma`: `6.12.0` (resolved in `package-lock.json`)

This version is currently selected because the repository's actual audit state
is clean: `npm audit --audit-level=high` reports zero vulnerabilities at
`6.12.0`. During dependency selection, Prisma `6.19.3` was evaluated and
reported three high-severity findings through `@prisma/config` and
`deepmerge-ts`, including advisory `GHSA-ggr8-5vv4-36mx` for recursive-object
stack exhaustion in `deepmerge-ts`. The audit remediation offered by npm
selected Prisma `6.12.0`.

Prisma `6.12.0` is therefore acceptable under the dependency-management policy:
it is the approved database technology, has a clean current high-severity audit,
and is locked reproducibly. This is a temporary/current dependency decision,
not a permanent exemption. It must be revisited through the normal dependency
update process, including audit, compatibility, and regression validation.

## Prisma schema scope

`prisma/schema.prisma` contains only the PostgreSQL datasource and Prisma client
generator required to establish connectivity. It intentionally contains no GISI
models, relations, migrations, seeds, or business repositories. Those are
separate approved tasks.

## Integration testing

Unit tests use an injected client port and do not require PostgreSQL. The
integration test is enabled only when `RUN_DATABASE_INTEGRATION_TESTS=true` and a
safe `DATABASE_URL` is supplied. It is skipped by default because this task does
not provision a local PostgreSQL or Testcontainers environment.
