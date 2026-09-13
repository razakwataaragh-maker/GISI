# GISI Request and Response Standards

## JSON standards

- Use `application/json` for API requests and responses.
- Use UTF-8 JSON.
- Field names use lower camel case.
- Dates and timestamps use ISO 8601/RFC 3339 strings in UTC.
- Monetary values must use an explicitly documented decimal representation; floating-point values must not be used for financial calculations.
- Enumerated values use stable documented strings.
- Nullability must be explicit in the OpenAPI contract.
- Unknown request fields should be rejected or handled according to the endpoint schema; permissive silent acceptance is prohibited.
- Sensitive values must never appear in responses unless explicitly required and authorized.

## Request conventions

- Validate path parameters, query parameters, headers, and request bodies.
- Reject malformed JSON.
- Reject unsupported content types.
- Enforce request size limits.
- Authenticate before protected application work.
- Authorize the action server-side.
- Treat all client input as untrusted.

## Success responses

Use the SRS status codes:

- `200 OK`: successful retrieval, update, or action with a response body.
- `201 Created`: successful resource creation; include a representation and/or resource location where applicable.
- `204 No Content`: successful operation with no response body.

Successful collection responses should use a stable envelope:

```json
{
    "data": [],
    "pagination": {
        "page": 1,
        "pageSize": 25,
        "totalItems": 0,
        "totalPages": 0
    }
}
```

Single-resource responses should use:

```json
{
    "data": {}
}
```

The exact response schema belongs to each module's OpenAPI contract.

## Error responses

The complete public error taxonomy and status mapping are binding in
`docs/api/error-taxonomy.md`.

All errors use:

```json
{
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [],
    "correlationId": "..."
}
```

Rules:

- `code` is stable and machine-readable.
- `message` is safe for the caller.
- `details` contains structured validation or conflict information where appropriate.
- `correlationId` identifies the request for support and diagnostics.
- Stack traces, secrets, SQL, provider responses, and internal implementation details are never returned.
