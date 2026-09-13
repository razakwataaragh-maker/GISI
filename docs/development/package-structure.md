# GISI Package Manifest Structure

This document specifies the package structure to be created by the dependency-management implementation. It is documentation only; package manifests are created by a later implementation step.

## Root manifest

The repository will contain one root `package.json` with these sections:

```json
{
    "name": "gisi",
    "version": "0.1.0",
    "private": true,
    "engines": {
        "node": ">=22 <23",
        "npm": ">=10 <12"
    },
    "scripts": {
        "dev": "...",
        "build": "...",
        "start": "...",
        "typecheck": "...",
        "lint": "...",
        "format": "...",
        "format:check": "...",
        "test": "...",
        "test:unit": "...",
        "test:integration": "...",
        "test:api": "...",
        "test:architecture": "...",
        "test:security": "...",
        "test:performance": "...",
        "test:coverage": "...",
        "db:migrate": "...",
        "db:migrate:validate": "...",
        "db:seed": "...",
        "docs:validate": "..."
    },
    "dependencies": {},
    "devDependencies": {}
}
```

The exact scripts and versions are added only when the relevant implementation tasks begin.

## Supporting manifests

The foundation will add, when appropriate:

- `package-lock.json` — committed npm lockfile.
- `tsconfig.json` — base TypeScript compiler policy.
- `tsconfig.build.json` — production build configuration.
- `tsconfig.test.json` — test-specific configuration if required by the selected test setup.
- `.npmrc` — repository npm behavior, without credentials.
- `.nvmrc` or equivalent runtime selector — Node.js 22 LTS policy.
- `vitest.config.*` — test discovery, environments, coverage, and thresholds.
- `eslint.config.*` — linting rules.
- `prettier.config.*` — formatting rules.

## Source ownership

The root manifest owns shared tooling and runtime dependencies. It must not be split into per-module package manifests during Version 1.0 unless a future ADR explicitly approves a workspace architecture.

Business modules remain directories inside the modular monolith, not independently published npm packages.
