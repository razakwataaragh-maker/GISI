# GISI Configuration Management Architecture

- **Status:** Implemented for the Foundation configuration boundary

## Configuration boundary

Generic configuration is loaded and validated in `src/bootstrap/configuration.ts`. Cognito configuration is loaded by `src/infrastructure/authentication/cognito-configuration.ts`. These are the only configuration boundaries allowed to read process environment values.

The composition root receives typed `ApplicationConfiguration` and, when Cognito is selected, typed `CognitoConfiguration`. Modules receive only the configuration values they require through explicit registration or service dependencies.

## Loading precedence

1. Safe application defaults.
2. Node.js process environment values.
3. Parse and validate.
4. Freeze and expose typed configuration.

Node.js 22's native `--env-file` mechanism is used by local launch commands when environment files are needed. Local development/test commands may explicitly load `.env`, `.env.{NODE_ENV}`, and then `.env.local`, with later files taking precedence. Staging and production commands must not pass `.env.local` and must receive values from deployment configuration and managed providers. The application loader itself never discovers or loads any environment file.

## Validation

Generic validation covers:

- Required values
- Allowed environment and log-level values
- Numeric port range
- PostgreSQL URL protocol and format
- Authentication provider values

Cognito validation covers only the Cognito adapter's region and identifiers.

Validation errors contain variable names and safe rule descriptions only. Raw values, connection URLs, identifiers, and credentials are never included.

## Immutability

The returned configuration object and nested objects are recursively frozen. Consumers cannot modify configuration after startup.

## Secret handling

The generic configuration object contains the database connection credential because the database adapter requires it. Cognito identifiers remain in the authentication infrastructure configuration. Values are classified as:

- **Secret:** database connection URLs containing credentials and any future client secrets or private keys. Never log or include in errors.
- **Sensitive operational value:** environment-specific connection endpoints or infrastructure metadata that may aid reconnaissance. Redact unless explicitly needed.
- **Non-secret identifier/configuration:** AWS region, Cognito user-pool ID, client ID, application name, port, and log level. These are not credentials, but remain out of unnecessary diagnostics.

No actual Cognito client secret is used by this boundary. If introduced later, it must be handled as a secret by the infrastructure adapter.

## Environment separation

The same configuration model and validation rules apply to development, test, staging, and production. Only values and secret providers differ. Business logic is not duplicated per environment. Staging and production cannot accidentally consume `.env.local` because the application does not load files and deployment commands must explicitly provide only approved environment sources.
