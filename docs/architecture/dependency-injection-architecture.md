# GISI Dependency Injection Architecture

## Decision

Use explicit constructor and factory injection as the default dependency-injection strategy. A framework container may be evaluated later, but no container is required for the Foundation composition design.

## Principles

- Dependencies are created at the composition root.
- Consumers receive interfaces or narrow contracts, not service locators.
- Constructors make required dependencies explicit.
- Factories are used when an object graph is complex or lifecycle-scoped.
- Optional dependencies are explicit and documented.
- Domain objects receive only domain-safe dependencies.
- Infrastructure implementations may depend on provider SDKs.
- Request-scoped values are passed through request/application context, not global mutable state.

## Dependency categories

### Process-singleton dependencies

Created once per process:

- Validated configuration
- Logger factory
- Clock
- Identifier generator
- Database client/pool
- Authentication provider client
- Storage provider client
- Email provider client
- Event/scheduler client

### Application-scoped dependencies

Created once for the running application:

- Repositories
- Unit-of-work factory
- Application services
- Domain policy services
- Audit writer
- Module contexts

### Request-scoped dependencies

Created or derived per request:

- Correlation context
- Authenticated principal
- Authorization context
- Request metadata
- Transaction context when required by the use case

Request scope must not leak across concurrent requests.

## Dependency rules

- Do not use a global service locator.
- Do not instantiate database, AWS, logger, or authentication clients inside domain classes.
- Do not hide required dependencies behind module-level mutable variables.
- Interfaces belong at the layer that consumes them.
- Infrastructure implements interfaces; it does not redefine business contracts.
- Tests may inject fakes or controlled adapters through the same contracts.

