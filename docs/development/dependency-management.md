# GISI Dependency Management Specification

- **Status:** Approved
- **Scope:** Project Foundation and Version 1.0
- **Technology baseline:** TypeScript, Node.js 22 LTS, Fastify, Prisma, Vitest, Docker, GitHub Actions

## Purpose

This document defines how GISI declares, installs, reviews, updates, and releases software dependencies. It applies to application code, infrastructure code, test code, scripts, documentation tooling, and CI actions.

## Package manager

GISI will use **npm** with the npm version bundled with the supported Node.js 22 LTS toolchain.

Node.js 22's native `--env-file` support is the approved local environment-file mechanism. No dotenv-style runtime dependency is required for configuration loading.

Standards:

- The repository has one authoritative root `package.json`.
- The repository has one authoritative root `package-lock.json`.
- `npm ci` is the reproducible installation command for CI and clean environments.
- `npm install` is used by developers only when intentionally changing dependency declarations.
- `npm run` scripts are the documented interface for development, testing, validation, migrations, and builds.
- Direct global installation of project tooling is prohibited.
- Package manager and Node.js versions are pinned through the repository version policy.

## Dependency categories

- `dependencies`: packages required by the deployed application.
- `devDependencies`: build, test, lint, formatting, type-checking, documentation, and local development tools.
- `optionalDependencies`: permitted only when runtime capability is genuinely optional and the fallback is documented.
- `peerDependencies`: permitted only for published reusable packages; GISI Version 1.0 is an application, not a package distribution.

Production dependencies must be runtime-required and justified. Development-only tools must not be included in the production artifact.

## Dependency principles

- Prefer the Node.js standard library when it meets the requirement.
- Prefer established, actively maintained packages with compatible licenses.
- Add the smallest dependency that solves the requirement.
- Avoid duplicate packages that serve the same purpose.
- Do not add a dependency solely to avoid a small, clear internal helper.
- Infrastructure SDKs remain in infrastructure adapters and must not leak into domain or application contracts.
- AWS-specific packages must not become business-layer dependencies.
- Dependencies must support the modular monolith and cloud-portability principles.
- Every new production dependency requires a recorded reason.

## Installation and reproducibility

Clean installation:

```bash
npm ci
```

The lockfile is authoritative for resolved versions, integrity hashes, and transitive dependencies. CI must reject changes that make `npm ci` fail or that modify the lockfile without the corresponding manifest change.

## Vulnerability and license controls

CI must run:

```bash
npm audit --audit-level=high
npm doctor
```

The final CI implementation may use an approved equivalent scanner, but it must detect vulnerable direct and transitive packages, secrets, and incompatible licenses.

High or critical vulnerabilities require remediation, an approved temporary exception, or removal of the dependency before release.

## Dependency approval process

Every dependency change must:

1. Identify the capability requiring the dependency.
2. Explain why the standard library or an existing dependency is insufficient.
3. Classify the dependency as production or development-only.
4. Record its license, maintenance status, security posture, and expected impact.
5. Include the manifest and lockfile changes in the same pull request.
6. Include tests or validation demonstrating the dependency is used correctly.
7. Pass CI quality, security, and license checks.
8. Receive code-owner or architecture review for production, security, database, authentication, or AWS dependencies.

## Prohibited practices

- Committing secrets in package scripts or configuration.
- Installing packages globally as a project requirement.
- Using unpinned remote scripts in CI.
- Committing generated dependency directories such as `node_modules`.
- Circumventing lockfile validation.
- Adding packages that implement business rules outside GISI’s application/domain layers.
- Introducing a second package manager without an approved ADR.
