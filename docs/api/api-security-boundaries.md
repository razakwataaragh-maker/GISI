# GISI API Security Boundaries

## Public boundary

Only explicitly approved endpoints may be public. Public endpoints must still have input validation, rate limiting, safe errors, logging, and abuse protection.

Potentially public:

- Health checks, subject to deployment exposure policy
- Version reporting, with minimal metadata
- Certificate verification, when implemented and explicitly designed as public

## Authenticated boundary

Student and staff APIs require authenticated identity. The API must derive the caller from a verified authentication context and must not trust user IDs supplied by clients.

## Authorized boundary

Authorization occurs server-side using role and permission policies. Minimum SRS roles include Student, Finance Officer, Academic Officer, Administrator, and Super Administrator.

Examples:

- Students can access only their authorized data.
- Finance Officers can manage finance and eligibility, not activation.
- Academic Officers can activate, suspend, and reactivate students.
- Administrators have operational permissions according to policy.
- Super Administrators have elevated control subject to audit.

## Security requirements

- HTTPS in deployed environments
- Secure authentication middleware
- Authorization before use-case execution
- Input and output validation
- Request size and rate limits
- Safe CORS and security headers
- No secrets in URLs, logs, errors, or responses
- Audit logging for privileged and sensitive actions
- Consistent correlation IDs for investigations
