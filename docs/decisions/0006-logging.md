# ADR 0006: Pino Structured Logging

- **Status:** Accepted
- **Date:** 2026-09-13

## Decision

Use Pino for structured application logging.

## Rationale

- Low-overhead JSON logging is appropriate for API and Lambda execution.
- Supports required timestamp, level, event, user, correlation ID, module, and action fields.
- Integrates with CloudWatch and local development tooling.
- Supports child loggers for request and module context.
- Enables redaction configuration for sensitive values.

## Alternatives rejected

- **Winston:** mature, but higher overhead and less focused on the performance profile required here.
- **Console logging:** lacks consistent structure, context, redaction, and operational controls.
- **CloudWatch-specific logging APIs:** would couple application code to AWS.

## Constraints

Operational logs are not a substitute for immutable audit records. Passwords, tokens, secrets, payment credentials, and unnecessary personal data must never be logged.

