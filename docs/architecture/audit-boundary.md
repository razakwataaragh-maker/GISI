# GISI Audit Boundary

## Purpose

The audit boundary defines how GISI records actions that must remain
historically traceable. It supports the SRS requirements for auditability,
user accountability, controlled access, data retention, and historical
preservation.

This document is a specification only. It does not create audit tables,
migrations, APIs, or application services.

## Audit records and operational logs

Audit records and operational logs serve different purposes and must remain
separate:

| Concern         | Audit records                                                                                                                         | Operational logs                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Purpose         | Evidence of an auditable action, its actor, target, outcome, and relevant state transition                                            | Diagnosis, monitoring, performance analysis, and service operations                                 |
| Authority       | Authoritative historical record for accountable actions                                                                               | Non-authoritative operational telemetry                                                             |
| Mutability      | Append-only and immutable after acceptance                                                                                            | Managed according to logging and platform retention controls                                        |
| Retention       | Retained according to approved compliance and institutional retention policies; records must not be silently lost                     | Retained according to operational, cost, and troubleshooting requirements                           |
| Access          | Restricted to authorized audit, compliance, security, and administrative roles                                                        | Restricted to operational personnel and systems according to least privilege                        |
| Storage         | Owned by the audit/compliance capability                                                                                              | Emitted through the `ApplicationLogger` and collected by the deployment platform                    |
| Failure meaning | An auditable action is incomplete if its required audit record cannot be durably accepted, subject to the use-case transaction policy | A missing log is an observability gap and must not be treated as proof that an action did not occur |

Operational logs must never be used as the audit system of record. Audit records
must not be implemented as a search or export of Pino output.

## Auditable event categories

The following categories are mandatory for Version 1.0. Each event must have a
stable event name and an owning module.

### Security events

Record login success and failure, logout, user creation or modification,
authentication/security state changes, and permission or role assignment,
revocation, or grouping changes.

Required context includes:

- actor identity and actor type, or an explicit anonymous/unknown outcome for
  unauthenticated attempts;
- action and outcome;
- target user, role, permission, or security resource;
- UTC timestamp;
- request/process correlation ID when available;
- source/context needed for investigation, such as the initiating channel;
- reason or approved change reference where applicable.

Authentication failures must not record submitted passwords, tokens, session
contents, or provider credentials.

### Financial actions

Record payment creation/recording, verification, reversal or correction,
fee-structure changes, balance adjustments, financial eligibility decisions,
and other approved financial state transitions.

Required context includes:

- actor identity and actor type;
- action and outcome;
- target financial record or stable public reference;
- UTC timestamp and correlation ID when available;
- amount and currency only when required for the business record;
- before/after financial status or eligibility state where relevant;
- reason, approval reference, or reconciliation reference where applicable.

Never capture card numbers, bank account numbers, CVV values, payment tokens,
provider credentials, or complete payment payloads.

### Activation actions

Record activation, deactivation, suspension, reactivation, rejection, and
authorized overrides affecting a student's activation state.

Required context includes:

- authorized actor identity and actor type;
- action and outcome;
- target student and registration or activation reference;
- UTC timestamp and correlation ID when available;
- prior and resulting activation state;
- eligibility basis or override reason where relevant;
- approval or authorization reference where applicable.

An activation audit event must preserve the distinction between financial
eligibility and the separately authorized activation action.

### Result changes

Record result entry, approval, publication, correction, withdrawal, and
republication actions.

Required context includes:

- actor identity and actor type;
- action and outcome;
- target student, examination, course, or result reference;
- UTC timestamp and correlation ID when available;
- prior and resulting result state or value where required to reconstruct the
  change;
- reason and approval/reference information for corrections.

Only the minimum result data required for accountability may be retained in the
audit record. Unrelated student profile data must not be copied.

### Administrative actions

Record creation, modification, archival, and approved status changes for
administrative configuration, reference data, programme/session settings,
retention settings, and other privileged administrative operations.

Required context includes:

- actor identity and actor type;
- action and outcome;
- target resource and owning module;
- UTC timestamp and correlation ID when available;
- safe before/after state or a reviewed field-level diff where relevant;
- reason, approval, or change reference where applicable.

Administrative audit data must not include secrets, configuration credentials,
or unrestricted request payloads.

## Common audit record requirements

Every accepted audit record must capture, as applicable:

- a unique, stable audit-record identifier;
- event name and category;
- actor identifier and actor type, including an explicit system actor for
  authorized automated actions;
- action and outcome;
- target type and stable target identifier;
- UTC occurrence timestamp and durable-record timestamp when those differ;
- request/process `correlationId` when available;
- owning module and source boundary;
- reason, approval, or change reference when required;
- safe before/after state, field-level diff, or state references when the event
  changes important historical data.

Audit records must capture enough information to answer who did what, to which
target, when, through which request or process, with what result, and what
important state changed.

Audit records must never capture:

- passwords, password hashes, recovery answers, authentication tokens, cookies,
  private keys, client secrets, or connection strings;
- full payment credentials or payment-provider secrets;
- complete request or response bodies when not strictly required;
- unnecessary personal or sensitive data;
- raw provider exceptions, stack traces, SQL, internal paths, or credentials;
- opaque access credentials merely because they are present in a request.

Identifiers in audit records are operational references, not authorization
credentials. Access to an identifier does not grant access to the target.

## Immutability and historical preservation

Audit records are append-only. Once a record is durably accepted, application
code must not update or delete it. A correction is represented by a new
compensating audit event that references the prior record; the prior record is
preserved.

The future audit storage implementation must enforce this boundary using
defense in depth:

1. The audit writer exposes append operations only; no update or delete
   contract is provided to business modules.
2. The database role used by the application has insert and approved read
   permissions but no update or delete permissions on audit storage.
3. Database constraints, triggers, or equivalent storage controls reject
   mutation and unauthorized deletion.
4. Audit migrations and retention changes are reviewed, version controlled, and
   cannot silently rewrite historical records.
5. Administrative access is separately authorized and itself auditable.
6. Any legally required disposal follows an approved retention/legal policy,
   documented authorization, controlled execution, and a resulting audit event;
   routine cleanup or cascade deletion is prohibited.

Foreign-key behavior must not orphan audit history. Audit records should use
stable references and must not require destructive deletion of the target
record to remain valid.

## Module ownership and write boundary

The audit/compliance capability owns the audit contract, storage, retention
controls, access policy, and audit retrieval behavior. No business module may
write another module's audit tables or storage directly.

A business module that performs an auditable action must publish or invoke the
approved audit-writer contract with a safe event payload. The audit capability
validates the event, assigns the audit-record identity, applies retention and
immutability controls, and persists it. Cross-module requests use an explicit
application-level contract or documented domain/application event, consistent
with the module-boundary rules.

The composition root wires the audit writer implementation. Domain code and
business modules depend on the contract, not on Prisma, audit tables, Pino, or
another module's infrastructure adapter. The future implementation must define
the transaction/outbox behavior needed to ensure an auditable business
transition and its audit event cannot silently diverge.

## Correlation IDs and structured logging

The correlation ID links an audit record to the request or process that caused
the action. When an action is initiated through the API, the audit writer
receives the ID resolved by the existing `X-Correlation-ID` lifecycle boundary.
For asynchronous or scheduled work, the initiating process must supply a
stable process correlation ID.

Correlation IDs are not secrets, authentication credentials, or audit records.
They identify a diagnostic context and may appear in both an audit record and
an operational log, but the two records remain separate.

The structured logger may record the audit event name, audit-record ID, module,
outcome, target reference, and correlation ID for operational visibility. It
must not become the source of truth, duplicate the complete audit payload, or
receive prohibited sensitive data. Audit diagnostics use the same logger
redaction policy documented in the structured logging architecture.

## Access and retention

Audit retrieval is controlled by least-privilege roles and is separate from
ordinary operational-log access. Queries and exports must themselves be
auditable, and returned data must be minimized to the authorized purpose.

Retention periods are policy-controlled and must be defined before the audit
storage task is implemented. The implementation must support the approved
institutional and legal retention policy without weakening append-only
historical preservation.

## Minimal writer implementation

The generic audit capability persists events in the dedicated `audit_events`
table. It is separate from IAM and other module-owned tables and stores the
stable event, actor, target, outcome, timing, correlation, ownership, reason,
change-reference, and safe before/after state fields defined above.

The application-owned `AuditWriter` contract exposes only `append`. Its
infrastructure implementation validates event payload keys recursively before
writing through Prisma and rejects prohibited credentials, tokens, connection
strings, provider errors, stack traces, and similar sensitive fields. It does
not define IAM-specific event names.

The migration installs a PostgreSQL trigger that rejects `UPDATE` and `DELETE`
on `audit_events`, providing database-level immutability in the current
single-role local setup. Separate database roles with insert-only grants,
ownership separation, and restricted administrative access remain deployment
hardening work; the trigger is not represented as a claim that the local
`postgres` superuser cannot bypass database controls.
