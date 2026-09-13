# GISI Environment-Variable Strategy

## Authoritative variables

| Variable           | Required | Default       | Sensitive | Purpose                                                |
| ------------------ | -------: | ------------- | --------: | ------------------------------------------------------ |
| `APP_NAME`         |       No | `gisi`        |        No | Application name                                       |
| `APP_VERSION`      |       No | `0.1.0`       |        No | Application/build version                              |
| `NODE_ENV`         |       No | `development` |        No | Environment: development, test, staging, or production |
| `API_HOST`         |       No | `127.0.0.1`   |        No | HTTP listener host                                     |
| `API_PORT`         |       No | `3000`        |        No | HTTP listener port, 1-65535                            |
| `LOG_LEVEL`        |       No | `info`        |        No | Structured logging level                               |
| `AUTH_PROVIDER`    |       No | `cognito`     |        No | Authentication provider                                |
| `DATABASE_URL`     |      Yes | None          |       Yes | PostgreSQL connection URL                              |
| `AWS_REGION`       |      Yes | None          |        No | AWS provider region                                    |
| `AWS_USER_POOL_ID` |      No* | None          |        No | Cognito user-pool identifier                           |
| `AWS_CLIENT_ID`    |      No* | None          |        No | Cognito client identifier                              |

Required values are validated before infrastructure clients or modules are created. Sensitive values are retained only in the immutable in-memory configuration object and are never included in configuration summaries or validation errors.

`AWS_REGION`, `AWS_USER_POOL_ID`, and `AWS_CLIENT_ID` are required only when the Cognito authentication adapter is selected. They are non-secret operational identifiers, not credentials.

## Principles

- Environment variables configure the application; they do not contain business logic.
- Required values are validated during startup.
- Secret values are supplied through local environment management and are never committed.
- `.env.example` documents names and safe placeholders only.
- Test configuration must not point to production.
- Configuration categories and precedence are documented centrally.

## Configuration model

The application receives a typed, immutable `ApplicationConfiguration` object from the bootstrap configuration boundary. Business and domain modules do not read `process.env` directly.

The current model contains:

- `app`
- `api`
- `database`
- `logging`
- `authentication`

Future storage, email, scheduling, rate-limiting, feature, academic, and activation settings must be added to this model through the configuration implementation, not through direct environment access in modules.

## Loading mechanism

Node.js 22 provides the approved native `--env-file` mechanism. The application configuration loader consumes the process environment and does not discover local files.

Local development may use an explicit command sequence such as:

```bash
node --env-file=.env --env-file=.env.development --env-file=.env.local ...
```

Tests may use:

```bash
node --env-file=.env --env-file=.env.test ...
```

Staging and production must not pass `.env.local` or developer workstation files. They must use deployment-managed environment configuration and approved secret providers.

## Local files

Permitted local-only files may include:

```text
.env.local
.env.test
```

These files must be ignored by source control and must not be copied into deployment artifacts. When explicitly used locally, the base file is loaded first, the environment-specific file second, and `.env.local` last.

## Secret handling

- Use a password manager or protected shell environment for local secrets.
- Do not paste credentials into source files, issue trackers, logs, or screenshots.
- Rotate credentials if they are exposed.
- Production secrets belong in AWS Secrets Manager or Parameter Store, not local files or Git.
- AWS-specific secret retrieval remains an infrastructure/deployment concern.

## Sensitivity classification

- Secret: database URLs containing credentials, private keys, tokens, passwords, and future client secrets.
- Sensitive operational value: connection endpoints and deployment metadata requiring restricted exposure.
- Non-secret identifier/configuration: AWS region, Cognito user-pool ID, Cognito client ID, application name, port, and log level.

Non-secret does not mean unrestricted; expose operational identifiers only when needed.
