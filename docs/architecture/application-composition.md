# GISI Application Composition Specification

- **Status:** Approved
- **Scope:** Project Foundation and Version 1.0

## Purpose

The application composition root is the only place that assembles the GISI application. It converts validated configuration and infrastructure implementations into a running modular monolith without placing business logic in startup code.

## Composition root

The future composition root belongs under `src/bootstrap/`. It is responsible for:

- Loading and validating configuration.
- Creating shared cross-cutting services.
- Creating infrastructure adapters.
- Creating module dependencies.
- Registering module routes and lifecycle hooks.
- Building the Fastify application.
- Returning a fully composed application to the runtime entry point.

The composition root must not:

- Implement business rules.
- Query business data directly.
- Contain request-specific logic.
- Import infrastructure implementations into domain code.
- Read unvalidated environment variables.
- Discover arbitrary executable files at runtime.

## Composition stages

```text
Validated Configuration
  → Shared Services
  → Infrastructure Adapters
  → Module Contexts
  → API Registration
  → Lifecycle Hooks
  → Running Application
```

## Ownership

- `src/bootstrap/` owns assembly and lifecycle.
- `src/shared/` owns approved shared contracts and primitives.
- `src/infrastructure/` owns provider and persistence implementations.
- `src/modules/` owns module contexts, use cases, domain behavior, and module API registration.
- The runtime entry point owns process signals and exit status.

