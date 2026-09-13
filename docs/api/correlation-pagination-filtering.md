# GISI API Correlation, Pagination, Filtering, and Sorting

## Correlation ID

Header:

```text
X-Correlation-ID
```

Rules:

- Accept a valid incoming correlation ID from trusted upstream infrastructure.
- Generate a new ID when absent or invalid.
- Return the ID in the response header.
- Include it in structured logs and error bodies.
- Do not use correlation IDs as authentication or authorization credentials.
- Bound length and character set to prevent log injection.

Implementation:

- The Fastify `correlationIdPlugin` runs during the `onRequest` lifecycle hook.
- The request header is read case-insensitively as `X-Correlation-ID`.
- Valid values contain only ASCII letters, digits, `.`, `_`, `:`, or `-`, and
  are 1-128 characters long.
- Invalid or missing values are replaced with a cryptographically generated
  UUID v4.
- The resolved value is available as `request.correlationId` and the
  request-scoped `request.applicationLogger` is a child logger containing
  `correlationId`.
- Every response receives the `X-Correlation-ID` header, including requests
  that supplied an invalid value.
- Error handlers must use `request.correlationId` when constructing error
  responses; correlation IDs are operational references, not secrets.

## Pagination

Collection endpoints use page-based pagination by default:

```text
GET /api/v1/students?page=1&pageSize=25
```

Rules:

- Default `page` is `1`.
- Default `pageSize` is `25`.
- Maximum `pageSize` is centrally configured.
- Invalid or excessive values return `422`.
- Responses include stable pagination metadata.
- Ordering must be deterministic, including a stable tie-breaker.
- Large or high-volume endpoints may adopt cursor pagination through an explicit module/API decision.

## Filtering

Filtering uses named query parameters:

```text
GET /api/v1/students?status=active&sessionId=...
```

Rules:

- Only documented filters are accepted.
- Filter values are validated by schema.
- Unknown filters are rejected or explicitly ignored according to the endpoint contract; silent behavior is discouraged.
- Filters must respect authorization and data ownership.
- Filter semantics must be documented in OpenAPI.

## Sorting

Sorting uses:

```text
sort=createdAt
order=desc
```

Rules:

- Only allowlisted fields may be sorted.
- Default sorting is stable and documented.
- Invalid fields or directions return `422`.
- Sorting must not allow raw SQL or provider expressions from clients.
- Sensitive or unauthorized fields must not be sortable.
