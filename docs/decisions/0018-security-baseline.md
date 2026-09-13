# ADR 0018: Version 1.0 Security Baseline Boundaries

- **Status:** Accepted
- **Date:** 2026-09-13
- **Scope:** Version 1.0 project foundation

## Context

GISI requires security by default, authentication, authorization, input
validation, audit logging, rate limiting, secure password handling, and least
privilege. Existing decisions establish the configuration boundary, Fastify
API framework, Cognito provider isolation, structured logging, and audit
ownership, but the cross-cutting baseline for transport and API security was
not yet binding.

## Decision

GISI will enforce the security baseline in
`docs/architecture/security-baseline.md`:

- Secrets enter through the existing typed configuration boundary or an
  approved infrastructure adapter for future AWS-managed secret providers.
  They never appear in source, logs, errors, audit records, responses, URLs, or
  Git history.
- HTTPS is mandatory for staging and production; local HTTP is limited to
  loopback development and tests.
- The HTTP/API edge owns secure headers, explicit environment-specific CORS,
  request limits, rate limiting, authentication wiring, and safe security
  error translation. Production CORS never uses wildcard origins.
- CI blocks high and critical dependency findings through
  `npm audit --audit-level=high`, subject only to reviewed, expiring
  exceptions, and also performs secret scanning.
- All endpoints validate transport input before application work and use the
  approved error taxonomy without exposing sensitive values.
- Application code consumes authentication and authorization interfaces with a
  verified non-secret principal; it does not depend directly on Cognito.
- Security events remain audit records under the audit/compliance boundary and
  are not replaced by operational logs.

## Consequences

Security controls have one enforceable ownership boundary and remain
independent of domain logic. Environment policy and infrastructure adapters
must be implemented in later tasks, and deployments must provide explicit
origins, TLS, proxy, rate-limit, and secret-provider configuration.

This decision does not implement middleware, rate limiting, CORS, Cognito,
authorization policy, or database changes.
