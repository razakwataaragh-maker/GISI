# ADR 0009: Docker and Docker Compose

- **Status:** Accepted
- **Date:** 2026-09-13

## Decision

Use Docker for reproducible service images and Docker Compose for local development and CI service orchestration.

## Rationale

- Provides a consistent PostgreSQL environment across Ubuntu developer machines and CI.
- Isolates local services from host configuration.
- Supports repeatable integration testing and future deployment packaging.
- Is compatible with AWS container workflows even though the initial application target may use Lambda.

## Alternatives rejected

- **Host-installed PostgreSQL only:** creates version and configuration drift.
- **Vagrant:** heavier than required for service-level reproducibility.
- **Kubernetes for local development:** excessive operational complexity for a modular monolith foundation.

## Constraints

Containers must not be treated as a reason to couple business logic to a deployment platform. Production deployment packaging will be decided by the AWS delivery design.
