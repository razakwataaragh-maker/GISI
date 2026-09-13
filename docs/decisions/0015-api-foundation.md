# ADR 0015: URL-Versioned REST API with OpenAPI 3.1

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

The SRS requires a versioned REST HTTP API with JSON requests/responses, authentication, authorization, validation, consistent errors, OpenAPI documentation, and defined HTTP status codes. GISI is a modular monolith whose APIs must preserve module ownership and cloud portability.

## Decision

GISI will use:

- URL versioning under `/api/v1`.
- JSON over HTTPS using lower camel case fields.
- Plural kebab-case resource paths.
- Explicit action endpoints for domain state transitions.
- Centralized authentication, authorization, correlation, validation, response, and error middleware boundaries.
- Standard success and error envelopes.
- `X-Correlation-ID` propagation.
- Page-based pagination by default with allowlisted filtering and sorting.
- OpenAPI 3.1 as the authoritative API contract.
- Explicit module API ownership and documented cross-module contracts.

Operational endpoints `/health`, `/health/ready`, and `/version` remain outside the business API prefix.

## Alternatives rejected

- **Header-only versioning:** less visible in URLs and less convenient for routing, monitoring, and operational support.
- **Query-only versioning:** weaker resource stability and easier accidental omission.
- **GraphQL:** conflicts with the SRS REST requirement.
- **Undocumented per-module conventions:** creates inconsistent client behavior and weakens governance.

## Consequences

Clients receive a visible and stable API version, modules retain ownership, and OpenAPI/API tests can enforce contracts. URL versioning requires explicit deprecation and migration discipline for future breaking changes.
