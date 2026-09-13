# GISI API Middleware Order

The default request pipeline is:

1. Transport and protocol safety
2. Request correlation ID extraction or generation
3. Request logging context
4. Request size, content-type, and rate-limit checks
5. Authentication parsing and verification
6. Authorization policy resolution
7. Request schema validation
8. Route/controller invocation
9. Application use-case execution
10. Response serialization and validation
11. Error translation when an exception occurs
12. Completion logging and correlation context cleanup

## Boundary rules

- Public operational endpoints may bypass user authentication but must remain protected from abuse.
- Authentication establishes identity; authorization decides permission.
- Authorization must occur before protected business use cases.
- Validation must not be used as a substitute for authorization.
- Error translation must be centralized and must preserve correlation IDs.
- Logging middleware must redact sensitive data.
- Controllers must not reorder or bypass mandatory security middleware.

## Health and version endpoints

`/health`, `/health/ready`, and `/version` are operational endpoints. They must:

- Return JSON.
- Avoid exposing secrets, connection strings, or internal topology.
- Be safe for load balancers and deployment checks.
- Have explicit rate-limit and exposure policies.

`GET /health` is a dependency-free liveness check and returns HTTP 200 with
`{"status":"ok"}` when the process is serving requests. `GET /health/ready`
delegates to the injected `DatabaseConnection.checkReadiness()` contract and
returns HTTP 200 only when PostgreSQL is ready. It returns HTTP 503 with a safe
dependency status when readiness fails. Neither endpoint requires
authentication, and neither response includes provider error details.
