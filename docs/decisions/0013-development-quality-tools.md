# ADR 0013: Repository Development Quality Standards

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

GISI requires a maintainable TypeScript modular monolith with strict type safety, automated testing, documented boundaries, and reproducible npm-based tooling. Tool configuration is intentionally deferred until the quality-tools implementation task is approved.

## Decision

GISI will standardize on:

- Prettier for formatting
- ESLint for linting
- TypeScript strict mode for static analysis
- Repository-local npm scripts for all quality checks
- Conventional commit prefixes
- Pull requests with architecture, security, testing, dependency, and documentation evidence
- Explicit module and layer dependency rules
- Lowercase kebab-case directories/files and conventional TypeScript symbol naming

## Alternatives rejected

- **Editor-specific formatting:** not reproducible across contributors or CI.
- **Lint-only quality control:** does not provide sufficient type and architectural safety.
- **Unstructured commits and reviews:** weakens traceability and makes the Definition of Done difficult to verify.
- **Independent module package manifests:** unnecessary for the Version 1.0 modular monolith and increases dependency drift.

## Consequences

The repository gains consistent, automatable quality rules. Actual tool configuration files and dependencies remain separate implementation work and must conform to these standards.

