# GISI Editor Standards

## Required editor behavior

Editors should:

- Respect the repository runtime and package-manager policy.
- Use UTF-8 and LF line endings.
- Format on save only when the repository formatter is installed and configured.
- Show whitespace and trailing-space issues.
- Use the repository TypeScript language service.
- Run lint and type-check diagnostics from repository scripts.
- Exclude generated files, dependency directories, secrets, and build output from search and source control.

## Workspace recommendations

The repository may later provide editor settings for:

- Prettier as the default formatter
- ESLint integration
- TypeScript strict diagnostics
- Recommended extensions
- Excluded paths
- Test discovery

Editor settings must support, not override, repository CI standards.

## No editor-only behavior

Code must remain valid when checked in CI or built on a clean Ubuntu environment. Developer-specific editor settings must not be required for correctness.

