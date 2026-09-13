# ADR 0014: Explicit Composition Root and Module Registration

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

GISI is a modular monolith with strict layer boundaries, cloud portability requirements, and an implementation order that must not be bypassed. The application needs predictable startup, test substitution, infrastructure isolation, and controlled lifecycle management.

## Decision

GISI will use:

- One explicit composition root under `src/bootstrap/`.
- Constructor and factory dependency injection by default.
- Explicit typed module registration.
- Configuration validation before service construction.
- Process/application/request lifecycle scopes.
- Explicit startup and graceful shutdown sequences.
- Infrastructure adapters registered behind application-owned interfaces.
- No runtime filesystem discovery of executable modules.

## Alternatives rejected

- **Global service locator:** hides dependencies and weakens testability.
- **Uncontrolled automatic filesystem discovery:** makes startup order and enabled modules difficult to review.
- **Constructing providers inside modules:** couples business code to infrastructure and complicates lifecycle management.
- **Framework-only dependency injection:** may obscure ownership and make domain code framework-dependent.

## Consequences

Composition is explicit and reviewable, with predictable lifecycle behavior and straightforward test substitution. The composition root may contain wiring complexity, which is accepted as the correct location for that complexity.

