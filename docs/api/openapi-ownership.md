# GISI OpenAPI 3.1 Ownership and Documentation

## Contract authority

OpenAPI 3.1 is the authoritative machine-readable API contract. It must describe:

- Paths and operations
- Authentication requirements
- Parameters
- Request bodies
- Response bodies
- Status codes
- Error schemas
- Pagination/filtering/sorting
- Deprecation metadata
- Examples that contain no sensitive data

## Ownership

- The API architecture owner owns global conventions and shared schemas.
- Each module owns the OpenAPI paths and schemas for its API surface.
- The composition/bootstrap layer owns operational endpoints.
- Cross-module endpoints require agreement from all affected module owners.
- The generated API reference must not become a separate undocumented contract.

## Documentation workflow

1. Define or update the OpenAPI contract.
2. Review request, response, security, and error behavior.
3. Validate the OpenAPI document in CI.
4. Generate the Scalar reference from the validated contract.
5. Add API tests for the documented behavior.
6. Update release notes for breaking or deprecated changes.

OpenAPI documentation must be version-controlled and updated with implementation changes.

