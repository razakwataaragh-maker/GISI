# GISI Structured Logging Architecture

## Implementation

GISI uses Pino through the `ApplicationLogger` boundary in
`src/infrastructure/logging/logger.ts`. The composition root creates one
process logger from validated application configuration and injects child
loggers into infrastructure and module contexts. Business and domain code must
not import Pino directly.

The logger emits newline-delimited JSON for both local and deployed execution.
Local tooling may format captured output externally; application code does not
switch to an AWS-specific logging API. Deployed stdout/stderr is collected by
the platform log agent.

## Record schema

Every record includes:

- `time`: ISO-8601 timestamp
- `level`: `trace`, `debug`, `info`, `warn`, `error`, or `fatal`
- `service`: application name
- `version`: application/build version
- `environment`: `development`, `test`, `staging`, or `production`
- `message`: human-readable operational message

Contextual records may include:

- `module`: owning module or infrastructure boundary
- `action`: operation being performed
- `event`: stable operational event name
- `correlationId`: request/process correlation identifier when available
- `userId`: approved non-secret actor identifier when operationally required

Correlation ID propagation is owned by the separate correlation-identifier task.
This logger only preserves an injected value.

## Severity

- `trace`: highly detailed diagnostics, disabled by default
- `debug`: development diagnostics and troubleshooting
- `info`: normal lifecycle and significant operational events
- `warn`: degraded but recoverable conditions
- `error`: failed operation requiring attention
- `fatal`: process cannot safely continue

The configured `LOG_LEVEL` controls the minimum emitted severity. Logging must
not be used as an audit-record substitute.

## Redaction and data handling

The logger redacts passwords, tokens, access/refresh tokens, client secrets,
authorization headers, cookies, database URLs, and equivalent nested fields.
Secrets must not be passed to the logger in the first place; redaction is a
defense-in-depth control, not permission to log credentials.

Logs must not contain connection strings, private keys, authentication
credentials, payment credentials, or unnecessary personal data. Error messages
must be safe before they reach the logger. Structured context must use stable
identifiers rather than full request bodies.

## Lifecycle and output

The logger is initialized after configuration validation and before
infrastructure startup. Startup failures use the same redacting logger where it
is available. Shutdown flushes the configured destination before process exit.
Logger construction is independent of CloudWatch, preserving portability.
