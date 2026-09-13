# ADR 0002: TypeScript and Node.js 22 LTS

- **Status:** Accepted
- **Date:** 2026-09-13

## Decision

Use TypeScript for backend application code and Node.js 22 LTS as the supported runtime.

## Rationale

- Provides strong typing for API contracts, configuration, domain models, and infrastructure interfaces.
- Supports a shared language with the planned React frontend.
- Has mature PostgreSQL, AWS, OpenAPI, testing, and observability libraries.
- Node.js 22 LTS provides a supported, stable runtime suitable for long-lived services and AWS Lambda.
- TypeScript enables compile-time enforcement of modular contracts.

## Alternatives rejected

- **Python:** strong ecosystem, but creates a second primary language and less consistent frontend/backend type sharing.
- **Java:** mature enterprise platform, but introduces greater ceremony and a heavier baseline for the initial modular monolith.
- **Go:** excellent operational characteristics, but reduces type and tooling alignment with the planned frontend and increases language diversity.

## Constraints

Runtime-specific code must remain behind infrastructure or bootstrap boundaries so the domain remains portable.

