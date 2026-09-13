# GISI Developer Bootstrap Workflow

## New developer onboarding

1. Read the authoritative documents:
    - [GISI-MASTER-SRS.md](../../GISI-MASTER-SRS.md)
    - [AI-PROJECT-INSTRUCTIONS.md](../../AI-PROJECT-INSTRUCTIONS.md)
    - [CLAUDE.md](../../CLAUDE.md)
    - [README.md](../../README.md)
2. Install the required Ubuntu prerequisites.
3. Configure Git identity and repository access.
4. Clone the repository.
5. Confirm Node.js 22 and npm versions.
6. Confirm Docker and Docker Compose versions.
7. Prepare local environment variables from `.env.example`; use Node.js `--env-file` explicitly for local-only files.
8. Start local PostgreSQL.
9. Run `npm ci` once the package manifest and lockfile exist.
10. Run database migrations and deterministic seeds once scripts exist.
11. Start the development server once the application bootstrap exists.
12. Verify `/health`, `/health/ready`, and `/version`.
13. Run formatting, linting, type checking, and relevant tests.
14. Read the module-boundary and review standards before making changes.

## Standard command sequence

```bash
cd /path/to/GISI
git pull --ff-only
node --version
npm --version
docker --version
docker compose version
npm ci
docker compose -f deploy/local/compose.yml up -d postgres
npm run db:migrate
npm run db:seed
npm run dev
```

Commands that depend on not-yet-created manifests, Compose files, or application code are intentionally documented for later implementation tasks.

## Pre-pull-request checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run docs:validate
```

Run additional integration, API, architecture, security, and performance checks relevant to the change.
