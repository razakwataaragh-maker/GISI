# GISI Dependency Update Policy

## Update cadence

- Security fixes: assess immediately and remediate according to severity.
- Critical/high vulnerabilities: target remediation before the next release unless an approved exception exists.
- Routine patch and minor updates: review at least monthly.
- Major updates: review deliberately during planned maintenance.
- Node.js LTS updates: review during each supported LTS maintenance cycle.

## Update workflow

1. Identify outdated or vulnerable packages.
2. Review changelogs, release notes, compatibility, license, and known advisories.
3. Update the manifest and lockfile together.
4. Run formatting, linting, type checking, unit tests, integration tests, API tests, architecture tests, and security checks.
5. Validate database migrations when database tooling changes.
6. Review bundle/runtime impact and startup behavior.
7. Obtain required architecture or security approval.
8. Merge through the normal protected-branch process.

## Automated updates

Automated update pull requests may be enabled for patch and minor updates, but they must:

- Modify only the intended dependency files.
- Pass all CI checks.
- Respect dependency ownership and approval rules.
- Not bypass security, architecture, or migration review.

Major, authentication, database, logging, API framework, or infrastructure SDK updates require human review.

## Exceptions

An exception must document:

- Package and affected version
- Vulnerability or compatibility issue
- Business and operational impact
- Mitigating controls
- Owner
- Expiry/review date

Exceptions are temporary and must not be used to bypass remediation indefinitely.
