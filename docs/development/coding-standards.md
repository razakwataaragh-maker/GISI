# GISI Coding Standards

## General conventions

- Write maintainable TypeScript aligned with the modular monolith architecture.
- Keep functions focused on one responsibility.
- Prefer composition and explicit interfaces over inheritance-heavy designs.
- Make dependencies explicit through constructors or composition boundaries.
- Validate all API, configuration, file, event, and external-provider input.
- Use immutable values where practical.
- Do not place secrets, credentials, or personal data in source, tests, fixtures, or logs.

## Layer responsibilities

### API layer

- Parse transport input.
- Authenticate and authorize requests through approved interfaces.
- Validate request and response schemas.
- Invoke application use cases.
- Translate known errors into the standard API error contract.
- Must not calculate business outcomes or access repositories directly.

### Application layer

- Coordinate use cases.
- Define transaction boundaries.
- Enforce application workflows and permissions.
- Call domain behavior and infrastructure interfaces.
- Publish required events and audit actions.

### Domain layer

- Own business rules, invariants, value objects, and domain decisions.
- Remain independent of HTTP, Prisma, AWS SDKs, Pino, and framework-specific types.
- Preserve historical and state-transition rules.

### Infrastructure layer

- Implement interfaces for PostgreSQL, authentication, storage, email, logging, scheduling, and AWS.
- Translate provider-specific behavior into application contracts.
- Must not introduce business decisions that belong in application/domain code.

## Imports and dependencies

- Prefer relative imports within a bounded module unless approved path aliases improve clarity.
- Do not import another module's infrastructure or persistence implementation.
- Import shared code only from the approved shared contract surface.
- Keep dependency direction inward: API → application → domain; infrastructure implements outward-facing interfaces.

## Error and logging conventions

- Use typed error categories and stable error codes.
- Preserve causes for internal diagnostics.
- Include correlation context in API and operational paths.
- Never log passwords, tokens, secrets, payment credentials, or unnecessary personal data.

## Database conventions

- Use migrations for schema changes.
- Enforce integrity in PostgreSQL with constraints, foreign keys, and indexes.
- Define transaction ownership at the application use-case boundary.
- Preserve original records and important state transitions.
