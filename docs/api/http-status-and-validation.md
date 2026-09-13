# GISI HTTP Status and Validation Standards

## Status codes

| Status | Meaning                                                         |
| ------ | --------------------------------------------------------------- |
| 200    | Successful retrieval, update, or action                         |
| 201    | Resource created                                                |
| 204    | Successful operation without a response body                    |
| 400    | Malformed or invalid request syntax                             |
| 401    | Missing or invalid authentication                               |
| 403    | Authenticated but not authorized                                |
| 404    | Resource does not exist or is not visible to the caller         |
| 409    | State or concurrency conflict                                   |
| 422    | Well-formed request failing validation or a business input rule |
| 500    | Unexpected internal failure                                     |

The API must not use a successful status for a failed business operation.

## Validation

Validation occurs in layers:

1. Transport/schema validation for syntax, types, required fields, formats, bounds, and unknown fields.
2. Authentication validation for token/session correctness.
3. Authorization validation for actor and resource permissions.
4. Application validation for use-case preconditions.
5. Domain validation for business invariants.
6. Database constraints as the final integrity boundary.

Validation errors must identify safe field-level details where possible. Domain and database failures must be translated into stable error codes without leaking internal details.

## Response validation

Every endpoint must define a response schema. The implementation must validate or serialize responses against the declared schema before sending them.

Response validation protects against:

- Accidental sensitive-field exposure
- Wrong field names or types
- Missing required values
- Inconsistent module contracts
- Undocumented provider data leakage
