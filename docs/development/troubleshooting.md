# GISI Local Development Troubleshooting

## Node.js or npm version mismatch

Symptoms:

- Engine warnings
- Inconsistent build behavior
- Dependency installation failures

Checks:

```bash
node --version
npm --version
which node
which npm
```

Resolution:

- Select Node.js 22 through the approved version manager.
- Open a new shell after changing the version manager configuration.
- Do not work around engine requirements with `--force`.

## `npm ci` fails

Checks:

```bash
npm --version
git status --short
```

Resolution:

- Confirm the manifest and lockfile are both present and synchronized.
- Pull the latest approved dependency changes.
- Remove only the local generated dependency directory if necessary, then retry.
- Do not manually edit the lockfile or use `--legacy-peer-deps` without an approved decision.

## Docker daemon unavailable

Checks:

```bash
docker info
docker compose version
```

Resolution:

- Start Docker Engine or Docker Desktop.
- Confirm the current user has approved Docker access.
- Inspect service logs without exposing secrets.

## PostgreSQL connection failure

Checks:

```bash
docker compose -f deploy/local/compose.yml ps
psql --version
```

Resolution:

- Confirm the PostgreSQL service is running.
- Confirm the configured host, port, database, username, and password.
- Confirm no other local PostgreSQL service is occupying the configured port.
- Wait for readiness before running migrations.
- Never point local configuration at production.

## Migration failure

Resolution:

- Read the first migration error and preserve the output.
- Confirm the database is the intended development/test database.
- Check migration status.
- Do not edit an already-applied migration.
- If the database is disposable, reset it only through an approved development workflow.
- Escalate destructive or ambiguous cases rather than guessing.

## Port conflict

Checks:

```bash
ss -ltnp
```

Resolution:

- Stop the approved conflicting local service or use a documented local port override.
- Do not change committed defaults solely to accommodate one workstation.

## Failing quality checks

Resolution:

- Run the failing repository script directly.
- Fix the underlying formatting, lint, type, or test issue.
- Do not disable a rule globally.
- Narrow suppressions require explanation and review.

## Credential or secret exposure

Immediate actions:

1. Stop sharing or committing the value.
2. Remove it from local output and issue discussions.
3. Rotate or revoke the credential.
4. Notify the security owner.
5. Inspect Git history and CI logs.
