# ADR 0012: npm and Root-Locked Dependency Management

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

GISI requires reproducible builds, a TypeScript/Node.js 22 LTS baseline, auditable changes, CI enforcement, and clear modular boundaries. Dependency files are not created by this task, but their future structure and governance must be fixed.

## Decision

Use npm with one private root manifest and one committed `package-lock.json`.

- CI and clean environments use `npm ci`.
- The supported runtime range is Node.js `>=22 <23`.
- The root manifest owns runtime and development tooling.
- Business modules are not independent npm packages in Version 1.0.
- Dependency changes require manifest and lockfile changes together.
- Security, license, architecture, and test checks are mandatory.

## Alternatives rejected

- **Yarn:** adds a second package-manager policy without a requirement.
- **pnpm:** efficient and workspace-capable, but unnecessary for the approved single-application modular monolith baseline.
- **Multiple package manifests:** increases dependency drift and weakens Version 1.0 module boundaries.
- **Uncommitted lockfiles:** prevent deterministic CI and release builds.

## Consequences

The project gains simple, reproducible dependency management and clear ownership. A future move to workspaces or independently published packages requires a new ADR and migration plan.
