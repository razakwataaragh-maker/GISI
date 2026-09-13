# GISI Module Boundary Rules

- **Status:** Approved
- **Scope:** Version 1.0 modular monolith

## Module structure

Each business module owns its:

```text
api/
application/
domain/
infrastructure/
tests/
```

The Foundation phase may create structural placeholders, but must not implement business functionality.

## Dependency direction

```text
API
  → Application
    → Domain
      → Contracts
Infrastructure → Contracts
```

Allowed:

- API depends on application use cases and transport contracts.
- Application depends on domain behavior and approved infrastructure interfaces.
- Infrastructure implements interfaces.
- Tests depend on the code under test.
- Shared contains only approved cross-cutting primitives and contracts.

Forbidden:

- Domain importing API, framework, database, AWS, logging, or infrastructure implementations.
- Controllers containing business rules.
- Database models containing business rules.
- One module importing another module's repository or infrastructure adapter.
- Direct cross-module table writes.
- Circumventing an application contract through shared database access.
- AWS SDK types in domain or application contracts.

## Cross-module communication

Cross-module behavior must use one of:

1. An explicit application-level contract.
2. A documented domain/application event.
3. A read-only query contract approved by both module owners.

Cross-module calls must not create hidden circular dependencies.

## Data ownership

- Each module owns its tables and migration changes.
- Other modules access owned data through contracts.
- Shared reference data requires explicit ownership.
- Historical and audit records must preserve accountability.
- Finance may determine eligibility but cannot invoke activation behavior.
- Activation must be performed only by authorized academic administration.

## Version 1.0 exclusions

No Foundation or Version 1.0 implementation may introduce the excluded Version 2.0 modules, including Cohort Management, Facilitator Management, Attendance Management, Class Scheduling, Mobile Applications, Online Assessment, or Payment Gateway Integration.
