# GISI Infrastructure Registration Standards

## Infrastructure adapters

Infrastructure implementations are registered in the composition root behind application-owned interfaces:

- PostgreSQL and Prisma
- Authentication provider
- Object/file storage
- Email delivery
- Scheduling and event publication
- Structured logging
- Audit persistence

AWS implementations may use Cognito, RDS, S3, SES, CloudWatch, and EventBridge, but AWS types and clients must remain in infrastructure adapters.

## Registration standards

- Create each external client once at the appropriate process/application scope.
- Validate required configuration before constructing clients.
- Register health/readiness checks for dependencies required to serve traffic.
- Register graceful close handlers for every resource with a close operation.
- Configure timeouts, retries, and connection limits explicitly.
- Do not create clients inside request handlers.
- Do not share mutable provider state across unrelated modules without an explicit contract.
- Test adapters through interfaces and controlled test implementations.

## Failure behavior

- Required infrastructure failure blocks readiness and may block startup.
- Optional infrastructure must have an explicit degraded-mode policy.
- External failures must produce typed internal errors and structured diagnostics.
- No provider failure may be silently converted to a successful business operation.

