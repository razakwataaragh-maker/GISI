# Identity and Access API endpoints

## Endpoint-to-architecture mapping

The API boundary follows the authentication ownership defined in
`docs/architecture/authentication-architecture.md`:

| SRS endpoint                 | API-layer behavior                                                                                                                                                                                                                                      | Status                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `POST /auth/login`           | Accepts an already-issued Cognito ID token as `accessToken`, verifies it through `AuthenticateUser`, maps the internal principal, and returns the safe principal. GISI does not accept credentials or issue tokens.                                     | Implemented                              |
| `POST /auth/logout`          | Cognito owns logout and provider-session invalidation. No GISI application operation or Cognito command adapter exists in the current contracts, so this route is not registered.                                                                       | Pending provider delegation decision     |
| `POST /auth/refresh`         | Cognito owns token refresh. GISI does not refresh or mint tokens, and no provider command adapter exists in the current contracts, so this route is not registered.                                                                                     | Pending provider delegation decision     |
| `POST /auth/forgot-password` | Cognito owns password recovery. GISI does not receive passwords or implement recovery, and no provider command adapter exists in the current contracts, so this route is not registered.                                                                | Pending provider delegation decision     |
| `POST /auth/reset-password`  | Cognito owns password reset. GISI does not receive passwords or implement reset, and no provider command adapter exists in the current contracts, so this route is not registered.                                                                      | Pending provider delegation decision     |
| `GET /me`                    | Verifies the bearer token, establishes request authentication context, authorizes `user.read`, and returns the mapped internal user.                                                                                                                    | Implemented                              |
| `GET /users`                 | Verifies and authorizes `user.read`, then performs one exact lookup using either `id` or `cognitoSubject`. The application contract has no list operation, so a collection listing is not invented; the response is a one-item array or an empty array. | Implemented with exact-lookup limitation |
| `POST /users`                | Verifies and authorizes `user.provision`, then delegates provisioning to `ManageUsers`.                                                                                                                                                                 | Implemented                              |
| `PATCH /users/{id}`          | Verifies and authorizes `user.update`, then delegates approved field updates to `ManageUsers`.                                                                                                                                                          | Implemented                              |
| `PATCH /users/{id}/status`   | Verifies and authorizes the requested lifecycle action, then delegates the transition to `ManageUsers`.                                                                                                                                                 | Implemented                              |

Every protected route extracts exactly one bearer token, uses the existing
correlation ID, and delegates authentication to `AuthenticateUser`. Route
authorization occurs before the application operation. The existing
`apiErrorBoundaryPlugin` supplies the binding error envelope and status
mapping.

## Role and permission endpoints

The SRS defines role and permission capabilities but does not specify exact
HTTP paths. The following paths are therefore provisional and require API
contract confirmation:

- `POST /roles` — create a role.
- `PATCH /roles/{id}` — modify a role.
- `PATCH /roles/{id}/status` — deactivate a role.
- `POST /roles/{id}/permissions` — grant a permission.
- `DELETE /roles/{id}/permissions/{permissionId}` — revoke a permission.
- `POST /users/{userId}/roles/{roleId}` — assign a role.
- `DELETE /users/{userId}/roles/{roleId}` — revoke a role.

These routes are thin adapters over `ManageRolesAndPermissions`; they do not
reimplement role, permission, assignment, or privilege-escalation logic.

## Validation and errors

Route schemas reject malformed bodies, parameters, and queries through the
existing Fastify error boundary as `VALIDATION_ERROR` (`422`). Missing or
invalid bearer credentials return `UNAUTHORIZED` (`401`), while an
authenticated principal denied by the authorization contract returns
`FORBIDDEN` (`403`). All error responses retain the request `correlationId`.
