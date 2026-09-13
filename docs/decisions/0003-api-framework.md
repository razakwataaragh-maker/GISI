# ADR 0003: Fastify for the REST API

- **Status:** Accepted
- **Date:** 2026-09-13

## Decision

Use Fastify as the HTTP framework for the versioned GISI REST API.

## Rationale

- High throughput and low overhead support the SRS performance targets.
- Schema-oriented request and response handling supports consistent validation.
- Plugin encapsulation maps well to modular-monolith boundaries.
- Built-in request injection simplifies API tests without requiring a network listener.
- Works with Node.js, TypeScript, OpenAPI tooling, and AWS Lambda adapters.

## Alternatives rejected

- **NestJS:** capable and structured, but adds framework abstraction and decorator complexity that is not required for the approved layered architecture.
- **Express:** mature and familiar, but provides fewer built-in schema and encapsulation conventions.
- **GraphQL:** conflicts with the SRS requirement for a versioned REST HTTP API.

## Constraints

Controllers and routes must remain thin. Business logic belongs in application and domain layers.

