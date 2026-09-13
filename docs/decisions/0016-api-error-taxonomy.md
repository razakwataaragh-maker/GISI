# ADR 0016: Stable API Error Taxonomy

- **Status:** Accepted
- **Date:** 2026-09-13
- **Scope:** Version 1.0 REST API foundation

## Context

GISI requires consistent JSON errors, approved HTTP status codes, correlation
IDs, safe diagnostics, and module-independent API behavior. Existing API
standards define the response envelope and status-code set but do not define the
complete stable code vocabulary or the translation rules for dependency,
persistence, and unexpected failures.

## Decision

GISI will use the standard error codes and one-to-one HTTP mappings defined in
`docs/api/error-taxonomy.md`:

- `BAD_REQUEST` → 400
- `UNAUTHORIZED` → 401
- `FORBIDDEN` → 403
- `NOT_FOUND` → 404
- `CONFLICT` → 409
- `VALIDATION_ERROR` → 422
- `BUSINESS_RULE_VIOLATION` → 422
- `DEPENDENCY_ERROR` → 500
- `PERSISTENCE_ERROR` → 500
- `INTERNAL_ERROR` → 500

Every error response has exactly the binding fields `code`, `message`, `details`,
and `correlationId`. The existing correlation-ID lifecycle boundary supplies
the correlation value. Unknown failures become `INTERNAL_ERROR`; provider and
implementation details remain in redacted structured logs only.

## Consequences

Clients can implement stable handling without depending on framework or
provider-specific errors. The future API error boundary owns centralized
translation and status selection. Modules may define additional internal
failure types, but public responses must use this taxonomy unless an approved
architecture decision extends it.

Validation and safe conflict details are allowed; internal, dependency, and
persistence diagnostics are not returned. This decision does not implement the
Fastify error handler or application error classes.
