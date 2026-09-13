# GISI VS Code Standards

## Recommended extensions

The following extensions are recommended, subject to organization policy:

- ESLint
- Prettier - Code formatter
- Docker
- PostgreSQL client or database tooling
- GitLens or equivalent Git visualization
- REST Client or an approved API client
- Mermaid preview support
- YAML support
- Markdown linting support

Extensions are convenience tools, not project dependencies. CI remains authoritative.

## Editor requirements

- Use UTF-8 and LF line endings.
- Use the repository's formatter and linter.
- Enable whitespace and trailing-space visibility.
- Exclude `node_modules`, build output, coverage, secrets, and generated files from search.
- Use the repository TypeScript version once dependency manifests exist.
- Do not rely on editor-only diagnostics for correctness.

## Recommended workspace behavior

When workspace settings are added by a later task, they should configure:

- Prettier as the default formatter
- ESLint integration
- TypeScript strict diagnostics
- Test discovery
- Recommended extensions
- Generated-file exclusions

