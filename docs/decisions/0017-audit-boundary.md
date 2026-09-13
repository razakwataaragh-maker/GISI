# ADR 0017: Audit Record Boundary and Ownership

- **Status:** Accepted
- **Date:** 2026-09-13
- **Scope:** Version 1.0 audit, security, and compliance foundation

## Context

The SRS requires auditability, user accountability, controlled access, data
retention, immutable audit records, and historical preservation. GISI also has
an implemented structured-logging boundary, but operational logs are
diagnostic telemetry and cannot serve as authoritative compliance records.
Business modules need a clear way to record important actions without writing
another capability's storage directly.

## Decision

GISI will maintain a distinct audit-record boundary:

- Audit records are append-only, immutable historical evidence; operational
  logs are mutable-retention diagnostic telemetry.
- The audit/compliance capability owns the audit contract, storage, retention,
  access policy, and retrieval behavior.
- Security, financial, activation, result, and administrative actions are
  auditable at minimum, with actor, action, target, timestamp, outcome,
  correlation ID when available, and relevant safe before/after state.
- Business modules request audit entries through an approved application
  contract or documented application/domain event. They do not write audit
  tables or another module's storage directly.
- Corrections are compensating audit events; accepted audit records are not
  updated or routinely deleted.
- Future storage must enforce immutability with application permissions,
  database controls, migration governance, and controlled access.
- Correlation IDs may link an audit record to operational logs, but correlation
  IDs do not merge the two systems and are never secrets or credentials.
- Passwords, tokens, payment credentials, provider secrets, unnecessary
  personal data, raw exceptions, and internal implementation details are
  prohibited from audit records and operational logs.

The complete event requirements and data-handling rules are defined in
`docs/architecture/audit-boundary.md`.

## Consequences

Audit evidence remains independently retrievable and defensible even when
operational logs rotate or are unavailable. Modules gain a stable integration
boundary and cannot bypass audit ownership with direct storage writes.
Immutability and retention require dedicated storage permissions, schema
controls, and operational governance in a later implementation task.

This decision does not create audit tables, migrations, audit APIs, or
application code.
