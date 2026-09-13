# GISI Repository Dependency Standards

## Ownership

- The root `package.json` and `package-lock.json` are the authoritative dependency declarations.
- The Architecture Owner reviews production, database, authentication, API framework, and AWS dependencies.
- The Security Owner reviews security-sensitive packages and vulnerability exceptions.
- Module owners review dependencies introduced for their module.
- CI owns automated policy enforcement, not dependency approval decisions.

## Required pull-request evidence

Dependency pull requests must include:

- Reason for the change
- Direct versus transitive impact
- Production versus development classification
- License review
- Security review outcome
- Test evidence
- Runtime/build impact
- Migration impact, if applicable

## Dependency boundaries

- Domain code may depend only on approved shared contracts and domain-safe libraries.
- Application code may depend on domain and approved shared contracts.
- Infrastructure code may depend on provider SDKs and persistence libraries.
- API code may depend on transport and validation libraries.
- Test-only libraries must remain development dependencies.
- AWS SDK usage is restricted to infrastructure adapters.

## Release gate

A release is blocked when:

- `npm ci` fails.
- The lockfile is inconsistent with the manifest.
- Required checks fail.
- A high/critical vulnerability lacks an approved exception.
- A dependency has an incompatible or unreviewed license.
- A prohibited package or package-manager change is introduced.

