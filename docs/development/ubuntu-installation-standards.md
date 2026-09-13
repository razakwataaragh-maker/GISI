# Ubuntu Installation Standards

Do not install software automatically as part of this documentation task. The following commands define the approved installation approach for a developer workstation.

## System preparation

```bash
sudo apt update
sudo apt install -y \
  ca-certificates \
  curl \
  git \
  build-essential \
  postgresql-client
```

## Node.js 22 LTS

Use an approved Node.js version manager, preferably `nvm`, or an organization-approved equivalent. Do not install project tooling globally through npm.

Example `nvm` workflow:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source "$HOME/.nvm/nvm.sh"
nvm install 22
nvm alias default 22
nvm use 22
node --version
npm --version
```

Expected policy:

```text
Node.js: 22.x
npm:     10.x or approved compatible npm bundled with Node.js 22
```

The command must be reviewed against the organization's secure installation policy before execution. CI must use the same major Node.js version.

## PostgreSQL

PostgreSQL may be installed through Ubuntu packages or run through Docker. The team must use one documented local method per environment to avoid port and version conflicts.

Host installation verification:

```bash
psql --version
```

Docker installation verification:

```bash
docker --version
docker compose version
```

## Docker

Install Docker Engine and the Compose v2 plugin according to Docker's official Ubuntu instructions. Add the developer to the Docker group only according to local security policy; group membership grants elevated host access.

Verification:

```bash
docker run --rm hello-world
docker compose version
```

## VS Code

Install the current stable VS Code release from the approved distribution channel. The editor must use the repository's TypeScript language service and local quality commands.

