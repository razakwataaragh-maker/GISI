# Ubuntu Development Prerequisites

## Supported operating system

- Ubuntu 24.04 LTS is the reference development platform.
- Ubuntu 22.04 LTS is supported where the required Node.js, PostgreSQL, Docker, and Git versions are available.
- WSL2 Ubuntu may be used if Docker integration and filesystem performance are configured correctly.

## Required software

| Software | Required version/policy | Purpose |
|---|---|---|
| Git | Current supported Ubuntu package, preferably 2.40+ | Source control |
| Node.js | 22 LTS, `>=22 <23` | Backend runtime and tooling |
| npm | Version bundled with Node.js 22, `>=10 <12` | Dependency management |
| PostgreSQL | 16 or later | Primary local database |
| Docker Engine | Current supported stable release | Reproducible services |
| Docker Compose | Compose v2 plugin | Local service orchestration |
| VS Code | Current stable release | Recommended editor |
| curl | Current supported Ubuntu package | Health/API checks |
| build tools | Ubuntu build-essential equivalent | Native npm modules where required |

## Optional software

- AWS CLI for later deployment tasks
- An approved PostgreSQL client
- An API client such as Bruno or Postman
- A password manager for local development secrets

Optional tools must not be required to run the application or tests.

