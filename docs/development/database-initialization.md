# GISI Local PostgreSQL Initialization

## Preferred local workflow

The approved baseline uses PostgreSQL 16+ and supports Docker Compose for reproducible local services.

Once the database service definition and package scripts exist, the expected workflow will be:

```bash
docker compose -f deploy/local/compose.yml up -d postgres
docker compose -f deploy/local/compose.yml ps
npm ci
npm run db:migrate
npm run db:seed
```

The exact Compose filename and script implementation are created by later tasks. Do not invent or add business schema during Foundation setup.

## Host PostgreSQL alternative

If an approved local host PostgreSQL installation is used:

```bash
psql --version
createdb gisi_development
```

The connection must be supplied through local environment configuration. Credentials must not be committed.

## Database rules

- PostgreSQL is required; SQLite is not a substitute.
- Migrations are the source of schema changes.
- Seeds are deterministic and development-only.
- Test databases are isolated from development databases.
- Production databases must never be used for local development.
- Do not manually alter schema objects outside the migration process.
- Reset or destructive operations require explicit confirmation and must never target production.

## Verification

The database is ready when:

- The configured connection succeeds.
- Migrations complete successfully.
- Seeds complete successfully where applicable.
- The readiness check reports the database dependency as available.
