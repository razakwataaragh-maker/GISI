# GISI Continuous Delivery Architecture

- **Status:** Defined for the Project Foundation
- **Scope:** Version 1.0 delivery strategy

## Purpose

This document defines how a tested GISI release is packaged, promoted,
configured, migrated, verified, and recovered. It does not implement a
deployment pipeline or provision cloud infrastructure.

## Immutable release artifact

The release artifact is built once from a specific reviewed commit and is
promoted unchanged through staging and production. The artifact consists of:

- the Node.js 22 application source compiled to the repository's approved
  distribution output when a production build is introduced;
- the exact `package-lock.json` and production dependency set installed with
  `npm ci`;
- the Prisma schema, generated client, and committed migrations required by
  that release;
- release metadata containing the source commit SHA, application version, and
  artifact identity.

Until a production build command and deployable server entry point exist, the
CI coverage report is the only foundation artifact currently produced. A
future delivery implementation must add a reproducible build/package command
before publishing a deployable artifact. It must never rebuild separately for
staging and production.

Environment-specific values are not part of the artifact. They include
`NODE_ENV`, `DATABASE_URL`, host/port settings, authentication identifiers,
provider configuration, logging level, and deployment-specific endpoints.
These values are injected by the target environment at deployment time.

## Promotion path and gates

The approved path is:

```text
local -> CI on pull request -> staging -> production
```

Local work must pass the applicable repository checks. A pull request must
pass the existing GitHub Actions CI workflow, including formatting, linting,
type checking, tests, coverage, Prisma validation/generation, migration
checks, dependency audit, and secret scanning.

Staging promotion requires:

1. A successful CI run for the exact commit.
2. Publication or selection of the immutable artifact.
3. Environment configuration and secret validation.
4. Approved migration review.
5. Database migration execution.
6. Post-deploy health and readiness verification.
7. Smoke or contract checks appropriate to the deployed surface.

Production promotion requires all staging gates plus an explicit human
approval in a protected GitHub environment named `production`. The approval
must be provided by an authorized reviewer who is not the person who
implemented the change when separation of duties is required. GitHub
environment protection rules, required reviewers, branch protection, and
least-privilege deployment permissions are the control points. This document
does not configure those repository settings.

## Configuration and secret injection

Deployment configuration must enter through the existing typed configuration
boundary in `src/bootstrap/configuration.ts` and approved infrastructure
boundaries. The application does not discover environment files in staging or
production.

Secrets, including PostgreSQL URLs, private keys, client secrets, and tokens,
must be supplied by deployment-managed secret storage or protected environment
secrets. They must not be committed, embedded in artifacts, printed in logs,
included in error responses, or written to audit records. AWS Secrets Manager
or SSM Parameter Store may provide the future AWS implementation, subject to
least-privilege IAM access and rotation policy.

Non-secret environment configuration may use protected environment variables.
The same typed validation and immutable configuration model applies in every
environment; only the source values and secret provider differ.

## Migration sequencing

Each release treats committed Prisma migrations as immutable release inputs.
The deployment sequence is:

1. Validate the artifact and target configuration.
2. Confirm a backup/recovery point and review migration compatibility.
3. Run `prisma migrate deploy` against the target database using the
   deployment-managed `DATABASE_URL`.
4. Stop the deployment if migration fails; do not start application code that
   requires an unapplied schema.
5. Deploy the application artifact.
6. Verify health, readiness, and smoke checks.

Migrations must be backward-compatible with the currently running version
where rolling or overlap deployment is possible. Destructive changes require
explicit review and a documented recovery plan. CI's ephemeral PostgreSQL
service validates the migration set before promotion, but it does not replace
backup, review, or operational controls for persistent environments.

## Post-deploy verification

A deployment is not successful until the deployed target responds correctly:

- `GET /health` returns HTTP 200 and confirms process liveness.
- `GET /health/ready` returns HTTP 200 with required dependencies ready.
- A non-ready response, timeout, unexpected version, or failed smoke check
  fails the deployment gate.

The verification must use the deployed endpoint through the target's approved
AWS/API boundary, not a local process. Correlation IDs and structured logs
must be retained for diagnosis without exposing secrets.

## Rollback and recovery

Application rollback means selecting the previously approved immutable
artifact and redeploying it after health verification. It does not mean
rebuilding from the current branch.

Database rollback is separate. Prisma has no universal automatic rollback for
applied migrations. A reversible migration may use a tested reverse operation,
but production failures normally require a new forward-fix migration. A
destructive or data-transforming migration may not be safely reversible;
recovery then depends on backups, restoration procedures, and an approved
forward fix. `prisma migrate reset` is never a production recovery strategy.

When a migration has already changed persistent data, the application artifact
must not be rolled back blindly. The release owner must first establish
whether the previous application version remains schema-compatible and choose
forward recovery or controlled database restoration.

## AWS deployment boundary

AWS is the initial deployment target, consistent with ADR 0011. The anticipated
service boundary is:

- API Gateway for the public API edge;
- Lambda or another approved managed compute boundary for application
  execution;
- RDS PostgreSQL for persistent database hosting;
- S3 for durable object storage where required;
- CloudFront for frontend/content delivery where required;
- Cognito for identity;
- CloudWatch for logs, metrics, alarms, and deployment observability;
- EventBridge for approved scheduled or event-driven work.

AWS-specific deployment and provider code remains outside domain and
application layers. This task does not choose final compute topology, create
CDK stacks, configure IAM, provision resources, or require AWS credentials.

## Scope boundary

This specification does not create a GitHub Actions CD workflow, AWS CDK,
Terraform, CloudFormation, deployment scripts, or live cloud resources.
