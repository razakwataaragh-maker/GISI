# ADR 0001: GISI Version 1.0 Technology Baseline

- **Status:** Accepted
- **Date:** 2026-09-13
- **Scope:** Project Foundation and Version 1.0

## Context

GISI requires a secure, auditable, scalable, cloud-portable modular monolith with a versioned REST API, PostgreSQL, structured logging, automated testing, OpenAPI documentation, and AWS as the initial deployment target.

## Decision

The Version 1.0 baseline is:

| Concern                | Decision                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- |
| Backend language       | TypeScript                                                                    |
| Runtime                | Node.js 22 LTS                                                                |
| API framework          | Fastify                                                                       |
| Database               | PostgreSQL 16+                                                                |
| ORM and migrations     | Prisma                                                                        |
| Authentication         | AWS Cognito behind an application authentication interface                    |
| Logging                | Pino                                                                          |
| Testing                | Vitest, Fastify `inject`, and Testcontainers for PostgreSQL integration tests |
| Documentation          | Markdown, Mermaid, OpenAPI 3.1, and Scalar API reference                      |
| Containerization       | Docker with Docker Compose for local development and CI services              |
| CI/CD                  | GitHub Actions                                                                |
| Cloud                  | AWS managed services behind infrastructure interfaces                         |
| Infrastructure as code | AWS CDK in TypeScript                                                         |

## Consequences

This baseline supports type safety, modular boundaries, fast local development, PostgreSQL transactions, test isolation, structured operational logging, and AWS deployment without putting AWS-specific behavior in the domain layer.

The baseline does not authorize implementation of business modules or creation of dependency manifests in this task.
