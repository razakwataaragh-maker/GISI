# GISI Version Policy

## Runtime versions

- Supported runtime: Node.js 22 LTS.
- Supported Node.js range: `>=22 <23`.
- Developers and CI must use the same major runtime version.
- Runtime upgrades require an ADR, compatibility testing, and CI validation.
- Security patch updates within the supported major version should be adopted promptly.

## Package versions

GISI will use npm semantic-version ranges in `package.json` and exact resolved versions in `package-lock.json`.

Policy:

- Production dependencies use conservative compatible ranges.
- Tooling dependencies may use compatible ranges where reproducible lockfile resolution is maintained.
- The lockfile, not a broad range, determines CI and release installations.
- Major dependency upgrades require explicit review and regression testing.
- Minor and patch updates remain subject to CI and security checks.

## Application versioning

GISI application releases follow Semantic Versioning:

- `MAJOR`: incompatible public API or platform contract change.
- `MINOR`: backward-compatible functionality.
- `PATCH`: backward-compatible fixes and security updates.

The application version must be recorded in the package manifest, exposed by `/version`, included in logs, and attached to build artifacts.

## Pre-release versions

Pre-release identifiers may be used for staging builds, for example:

```text
1.0.0-rc.1
```

Pre-release artifacts must not be promoted to production without an explicit release decision.
