# GISI API Error Taxonomy

## Binding error contract

Every failed API request returns JSON with this exact top-level shape:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request",
  "details": [],
  "correlationId": "..."
}
```

All four properties are present. `code` is a stable machine-readable string,
`message` is safe for callers, `details` is a JSON array, and `correlationId`
is the identifier resolved by the existing `X-Correlation-ID` request lifecycle
boundary.

Error responses use `application/json` and lower camel case property names.
The implemented Fastify API error boundary preserves the request correlation ID
even when it handles an unexpected failure.

## Standard error codes

Each code maps to exactly one standard HTTP status:

| Code | HTTP status | Applies when |
|---|---:|---|
| `BAD_REQUEST` | 400 | Request syntax is malformed, JSON cannot be parsed, content type is unsupported, or the request cannot be interpreted as an HTTP request. |
| `UNAUTHORIZED` | 401 | Authentication is missing, invalid, expired, or cannot establish an authenticated actor. |
| `FORBIDDEN` | 403 | The actor is authenticated but lacks permission for the requested operation or resource. |
| `NOT_FOUND` | 404 | The resource does not exist or must be concealed from the caller under the resource-visibility policy. |
| `CONFLICT` | 409 | The requested operation conflicts with current state, uniqueness, concurrency, or an already-applied transition. |
| `VALIDATION_ERROR` | 422 | A well-formed request fails transport, application, domain, or field-level input validation. |
| `BUSINESS_RULE_VIOLATION` | 422 | A well-formed request violates a documented business invariant or use-case precondition. |
| `DEPENDENCY_ERROR` | 500 | A required external or internal dependency fails while processing the request. |
| `PERSISTENCE_ERROR` | 500 | A database or persistence operation fails after input and authorization have been accepted. |
| `INTERNAL_ERROR` | 500 | An unexpected failure has no safer, more specific public classification. |

The HTTP status mapping is exhaustive for the standard taxonomy and uses only
the status codes approved by the SRS and API standards.

## Details rules

`details` must be an array of safe structured objects. A validation response may
contain field-level problems such as:

```json
[
  {
    "field": "email",
    "issue": "must be a valid email address"
  }
]
```

Validation details may identify a public field, a stable rule, an allowed
non-sensitive value set, or a safe conflict reference. They must not echo
secrets or unrestricted client payloads.

For `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, and
`BUSINESS_RULE_VIOLATION`, details should be empty unless a documented,
caller-safe explanation materially helps the client.

For `CONFLICT`, details may contain a stable public resource or field reference
and a safe remediation hint. For `DEPENDENCY_ERROR`, `PERSISTENCE_ERROR`, and
`INTERNAL_ERROR`, details must be an empty array in the caller response.
Operational diagnostic context belongs only in structured logs.

## Prohibited disclosure

No error response may contain:

- stack traces or exception objects;
- source paths, file names, line numbers, SQL, or query plans;
- raw database, Prisma, AWS, or other provider errors;
- connection strings, passwords, tokens, private keys, or credentials;
- internal service names, hostnames, ports, or deployment topology;
- unredacted request bodies or unnecessary personal data;
- authorization decisions or existence details that violate resource visibility.

Public messages must be stable and caller-safe. Internal logs may contain
diagnostic context only under the structured logging redaction policy and must
include the same correlation ID.

## Implemented API error boundary

The central Fastify error boundary:

1. Translates recognized framework, validation, authentication, authorization,
   domain, dependency, and persistence failures into this taxonomy.
2. Sets the exact mapped HTTP status.
3. Uses the existing request correlation ID; it does not create another
   correlation mechanism.
4. Returns the binding four-property JSON shape.
5. Logs unexpected/internal diagnostics through the injected structured logger.
6. Redacts provider details before logging and never returns them to callers.
7. Converts unknown failures to `INTERNAL_ERROR` with a safe message and empty
   details.

Routes and controllers must not implement their own competing error envelopes
or duplicate translation logic.
