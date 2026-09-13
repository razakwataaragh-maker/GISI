# GISI Module Registration Strategy

## Registration model

Each module will expose a typed registration function or module descriptor to the composition root. The descriptor will identify:

- Module name and version
- Required configuration keys
- Infrastructure capabilities required
- Application services to create
- API routes/plugins to register
- Health/readiness checks, if applicable
- Startup hooks
- Shutdown hooks

Modules will be registered explicitly in the approved Version 1.0 implementation order. Business modules are not implemented by the Foundation task.

## Explicit registration

The composition root will call known module registration functions rather than scanning the filesystem for executable code. Explicit registration provides:

- Deterministic startup
- Clear ownership
- Type-safe dependency requirements
- Reviewable module order
- No accidental activation of future modules
- Easier testing and deployment analysis

## Registration order

Within the application:

1. Shared services
2. Infrastructure adapters
3. Identity and access boundary
4. Module contexts in SRS implementation order
5. API routes and hooks
6. Health and readiness registrations
7. Startup lifecycle hooks

The Foundation API shell may register only foundation endpoints. Future business modules remain disabled until their phase begins.

## Module contract

A module registration contract must not expose private repositories, database models, or provider clients. It exposes only approved application contracts and API registration behavior.
