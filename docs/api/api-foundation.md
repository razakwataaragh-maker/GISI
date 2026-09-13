# GISI REST API Foundation

- **Status:** Approved
- **Scope:** Project Foundation and Version 1.0
- **Style:** Versioned REST HTTP API
- **Format:** JSON over HTTPS

## Purpose

The GISI API exposes application use cases through a stable, secure, documented REST contract. It is a transport boundary, not a location for business rules.

## API architecture

```text
HTTP Request
  → Correlation and security middleware
  → Authentication and authorization middleware
  → Request validation
  → Module route/controller
  → Application use case
  → Domain behavior
  → Infrastructure interfaces
  → JSON response
```

Routes and controllers must remain thin. They may parse, validate, authorize, invoke an application use case, and serialize a response. They must not calculate business outcomes, access repositories directly, or contain transaction workflows.

## API versioning

Version 1 uses a URL prefix:

```text
/api/v1
```

Foundation endpoints are:

```text
GET /health
GET /health/ready
GET /version
```

These operational endpoints are outside the business API prefix because they are consumed by infrastructure and deployment tooling. If a versioned operational API is later required, it must be introduced as a documented compatibility decision.

### Health responses

`GET /health` is a public liveness endpoint that does not query PostgreSQL:

```json
{
    "status": "ok"
}
```

`GET /health/ready` is a public readiness endpoint. It uses the existing
`DatabaseConnection.checkReadiness()` contract and returns:

```json
{
    "status": "ok",
    "ready": true,
    "dependencies": {
        "postgresql": true
    }
}
```

When PostgreSQL is not ready, the endpoint returns HTTP `503` and the same safe
shape with `"status": "not_ready"` and `false` dependency values. Provider
errors, connection strings, and internal topology are never returned.

### Version response

`GET /version` is public and does not require user authentication. It remains
inside the standard correlation-ID and centralized error-handling pipeline.
The response contains only controlled application metadata:

```json
{
    "name": "gisi",
    "version": "0.1.0",
    "buildIdentity": "gisi@0.1.0"
}
```

`buildIdentity` is deterministically composed from the validated application
name and version. The endpoint does not read `package.json` at runtime and
does not expose dependency versions, hostnames, paths, or infrastructure
metadata.

Breaking changes require a new major API version, for example `/api/v2`. Backward-compatible additions may be made within `/api/v1`.

## URL and route structure

General form:

```text
/api/{version}/{resource}
/api/{version}/{resource}/{id}
/api/{version}/{resource}/{id}/{sub-resource}
```

Examples from the SRS:

```text
/api/v1/students
/api/v1/students/{id}
/api/v1/applications/{id}/submit
/api/v1/finance/payments/{id}/verify
```

Rules:

- Use lowercase kebab-case segments.
- Use plural nouns for collections.
- Use opaque stable identifiers.
- Do not expose database table names.
- Do not encode business logic in URL structure.
- Use explicit action endpoints for meaningful state transitions.
- Keep public and authenticated routes clearly distinguishable through documentation and middleware policy.

## HTTP methods

| Method | Use                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| GET    | Retrieve a resource or collection; must be safe and idempotent                                               |
| POST   | Create a resource or execute a domain action                                                                 |
| PATCH  | Partially update mutable resource attributes                                                                 |
| PUT    | Full replacement only when replacement semantics are defined                                                 |
| DELETE | Delete only where the domain explicitly permits it; prefer archival/state transitions for historical records |

State transitions such as activation, suspension, publication, verification, approval, and rejection use explicit `POST` action endpoints where defined by the SRS.
