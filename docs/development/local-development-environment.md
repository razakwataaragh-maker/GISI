# GISI Local Development Environment Guide

- **Status:** Approved
- **Scope:** Project Foundation and Version 1.0
- **Primary platform:** Ubuntu LTS
- **Runtime:** Node.js 22 LTS

## Purpose

This guide enables a new contributor to prepare an Ubuntu workstation, bootstrap GISI, run local services, initialize PostgreSQL, execute quality checks, and troubleshoot common setup failures.

This is documentation for the approved Foundation baseline. It does not replace the later implementation of application scripts or configuration files.

## Development principles

- Use the repository's pinned runtime and package-manager policy.
- Use repository-local commands rather than globally installed project tools.
- Never commit secrets or local environment files.
- Use PostgreSQL for local development; do not substitute SQLite.
- Keep AWS services behind infrastructure interfaces.
- Do not implement or activate future business modules out of sequence.

