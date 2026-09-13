# GISI API Versioning and Deprecation Policy

## Versioning

- Public business API versions use URL prefixes such as `/api/v1`.
- A major version changes only for incompatible contract behavior.
- Additive fields and endpoints must preserve existing client behavior.
- Removing, renaming, or changing the meaning of a required field is breaking.
- Error-code changes that break client handling are breaking.
- Authentication or authorization changes that invalidate clients require migration planning.

## Deprecation

Deprecated endpoints or fields must:

- Be marked in OpenAPI.
- Include a reason and replacement.
- Include a planned removal version or date.
- Emit an appropriate deprecation response header where supported.
- Remain documented while clients migrate.
- Have tests for both deprecated and replacement behavior during the support period.

Recommended headers:

```text
Deprecation: true
Sunset: <RFC 7231 HTTP-date>
Link: <replacement-url>; rel="successor-version"
```

## Compatibility

API changes require:

- Consumer impact assessment
- OpenAPI update
- API and regression tests
- Security review where applicable
- Migration and release notes

