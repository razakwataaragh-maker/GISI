# ADR 0019: Immutable Promotion and Controlled Continuous Delivery

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

GISI has a GitHub Actions CI workflow and an AWS cloud strategy, but no
continuous delivery implementation yet. Deployment must preserve immutable
release identity, environment separation, migration safety, least privilege,
and the distinction between application rollback and database recovery.

## Decision

GISI will use a staged promotion model:

```text
local -> CI -> staging -> production
```

A release is built once from a reviewed commit and promoted unchanged. Runtime
configuration and secrets are injected by the target environment through the
existing typed configuration boundary and managed secret providers; they are
never embedded in source or release artifacts.

Staging requires successful CI, migration review and execution, configuration
validation, and post-deploy health/readiness verification. Production requires
the same controls plus a protected GitHub `production` environment with
authorized human approval and least-privilege deployment permissions.

Database migrations run before application deployment when the release
requires schema changes. They must be compatible with the currently running
version where overlap is possible. Failed migrations stop promotion. Applied
migrations are not assumed to be automatically reversible; recovery uses a
tested reverse operation only where safe, otherwise a forward-fix or approved
backup restoration.

Deployment verification must confirm `GET /health` is 200 and
`GET /health/ready` reports required dependencies ready before success is
recorded.

AWS remains the initial infrastructure boundary described by ADR 0011. This
decision does not select a final compute topology or implement CDK, GitHub
Actions CD, IAM, or AWS resources.

## Alternatives rejected

- Rebuilding independently for each environment, because it permits drift
  between staging and production.
- Embedding environment secrets in artifacts, because it violates the
  security baseline and prevents safe promotion.
- Automatically rolling back every database migration, because applied data
  changes are not universally reversible.
- Provisioning AWS resources as part of the foundation specification, because
  deployment implementation requires a separate approved task and credentials.

## Consequences

Releases have a traceable identity and can be promoted consistently. Protected
environment approvals and operational migration controls add deliberate
friction to production changes. Database recovery remains an explicit
operational concern rather than a false promise of automatic rollback.
