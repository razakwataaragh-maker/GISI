# ADR 0007: Vitest and Containerized Integration Testing

- **Status:** Accepted
- **Date:** 2026-09-13

## Decision

Use Vitest as the primary test runner, Fastify request injection for API tests, and Testcontainers for PostgreSQL integration tests.

## Rationale

- Vitest provides fast TypeScript-native unit and coverage workflows.
- Fastify injection tests the API without requiring a live network listener.
- Testcontainers provides isolated PostgreSQL behavior close to production.
- The combination supports unit, integration, API, architecture, security, and performance test categories.

## Alternatives rejected

- **Jest:** mature and viable, but slower and less aligned with a modern Vite-compatible TypeScript toolchain.
- **SQLite for integration tests:** does not faithfully represent PostgreSQL constraints, transactions, or SQL behavior.
- **Shared developer database:** produces non-deterministic tests and data leakage.

## Constraints

Coverage targets remain 90% domain, 80% application, and 70% API. Tests must be deterministic and must not use production data.
