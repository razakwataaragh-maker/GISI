# GISI Testing Harness

## Test runner and categories

GISI uses Vitest with deterministic local execution. Each test category has a
separate directory and npm script:

| Category | Directory | Command |
|---|---|---|
| Unit | `tests/unit` | `npm run test:unit` |
| Integration | `tests/integration` | `npm run test:integration` |
| API | `tests/api` | `npm run test:api` |
| Architecture | `tests/architecture` | `npm run test:architecture` |
| Security | `tests/security` | `npm run test:security` |
| Performance | `tests/performance` | `npm run test:performance` |
| End-to-end | `tests/end-to-end` | `npm run test:end-to-end` |
| All categories | `tests/**/*.test.ts` | `npm test` or `npm run test:all` |

Empty category directories are valid while their implementation tasks are
pending. The configured `passWithNoTests` behavior lets category scripts remain
usable without masking failures in suites that contain tests.

## Coverage

Run:

```text
npm run test:coverage
```

Vitest uses the V8 provider and writes text, JSON, and HTML reports under the
ignored `coverage/` directory. Thresholds are configured by source layer:

- `src/domain/**`: 90% lines, functions, statements, and branches;
- `src/application/**`: 80% lines, functions, statements, and branches;
- `src/api/**`: 70% lines, functions, statements, and branches.

The domain and application thresholds become enforceable as those source
directories gain code. The API threshold becomes enforceable when the
`src/api/` layer gains code; transport infrastructure remains covered by its
own focused tests without being misclassified as the API application layer.
Thresholds must not be lowered or bypassed to make a build pass. Coverage
reports are reviewed in CI and a threshold failure blocks the quality gate.

## Deterministic execution

Tests must not depend on uncontrolled network calls, wall-clock timing,
production data, or shared mutable state. Prefer Fastify injection, injected
ports, fake clients, and controlled clocks/timers. Each test owns and closes
its application resources.

Integration tests that require PostgreSQL must use an explicitly enabled gate,
such as `RUN_DATABASE_INTEGRATION_TESTS=true`, and a safe configured
`DATABASE_URL`. They are skipped by default when infrastructure is unavailable;
they must not silently substitute SQLite or a shared developer database.
Future integration suites must document their equivalent gate and required
services. Prisma migration application and live database validation remain
deferred until a PostgreSQL instance is explicitly provisioned; the existing
unit tests validate the connection boundary without fabricating integration
success.

## Adding tests

Place a test in the narrowest applicable category. Unit tests cover isolated
domain, application, and infrastructure behavior with injected collaborators.
API tests exercise Fastify request/response contracts. Integration tests verify
real PostgreSQL or provider boundaries behind explicit infrastructure gates.
Architecture tests enforce dependency direction. Security tests cover
boundaries, disclosure, authentication, authorization, and abuse controls.
Performance tests use controlled fixtures and explicit budgets. End-to-end
tests cover complete deployed workflows only when their environment is
explicitly provisioned.

Every feature should include the required unit, integration, API, validation,
and permission coverage from the project instructions where applicable.
