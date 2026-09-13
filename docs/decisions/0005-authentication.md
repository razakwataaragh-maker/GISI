# ADR 0005: Cognito Behind an Authentication Interface

- **Status:** Accepted
- **Date:** 2026-09-13

## Decision

Use AWS Cognito as the initial identity provider, accessed only through a GISI authentication interface.

## Rationale

- Supports login, logout, password reset, password change, session management, and token refresh required by the IAM phase.
- Provides managed password handling and account security capabilities.
- Integrates with the AWS deployment target.
- An application interface preserves cloud portability and permits future replacement.

## Alternatives rejected

- **Custom password authentication:** increases security, maintenance, and compliance risk.
- **Auth0 or Okta:** capable alternatives, but add an external provider dependency when AWS is the initial deployment target.
- **Application-managed sessions as the primary identity system:** creates avoidable credential and session-security responsibility.

## Constraints

Authorization and role enforcement remain server-side. Cognito authentication does not replace GISI authorization, audit logging, or business permission checks.
