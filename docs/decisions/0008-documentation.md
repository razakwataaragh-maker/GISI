# ADR 0008: Markdown, Mermaid, OpenAPI 3.1, and Scalar

- **Status:** Accepted
- **Date:** 2026-09-13

## Decision

Use version-controlled Markdown for project documentation, Mermaid for architecture diagrams, OpenAPI 3.1 for REST contracts, and Scalar for the interactive API reference.

## Rationale

- Markdown is diffable, reviewable, portable, and compatible with GitHub.
- Mermaid keeps architecture diagrams close to their source documentation.
- OpenAPI satisfies the SRS requirement for API documentation and enables validation and client tooling.
- Scalar provides a modern interactive API reference without making the API dependent on a proprietary platform.

## Alternatives rejected

- **Confluence or another hosted wiki:** weaker repository versioning and reviewability.
- **Swagger UI alone:** useful, but Scalar provides the selected interactive presentation while OpenAPI remains the contract.
- **Unversioned diagrams:** cannot reliably track architectural change.

## Constraints

Documentation updates are part of the Definition of Done. The SRS, architecture, API, deployment, user, and administrator documentation remain version-controlled.
