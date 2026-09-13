# GISI Commit and Pull Request Standards

## Commit requirements

Commits must:

- Be focused and logically coherent.
- Use the approved conventional prefixes: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, and `chore:`.
- Include a useful scope where appropriate, for example `docs(foundation): ...`.
- Explain the reason for non-obvious changes.
- Avoid mixing formatting-only changes with behavior changes.
- Never include secrets, generated dependency directories, or unrelated files.
- Pass applicable local quality checks before push.

## Pull request requirements

Every pull request must include:

- Summary of the change
- Related task or requirement
- Scope and out-of-scope statement
- Architectural impact
- Database/migration impact
- Security impact
- Test evidence
- Documentation impact
- Dependency impact
- Operational/deployment impact where applicable

Required review checks:

- Requirements and acceptance criteria are addressed.
- Module and layer boundaries are preserved.
- Error handling and logging are appropriate.
- Historical preservation is not weakened.
- Sensitive data is handled safely.
- Tests cover changed behavior.
- Documentation is updated.
- CI passes without unexplained warnings or exceptions.

## Approval requirements

Architecture review is required for:

- New module boundaries
- Public API changes
- Database ownership or migration policy
- Authentication and authorization
- AWS/provider integrations
- Dependency or package-manager changes
- Changes to shared contracts

Security review is required for:

- Authentication, authorization, secrets, PII, payments, audit, or access-control changes.
- Vulnerability exceptions.

