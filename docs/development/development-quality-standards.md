# GISI Development Quality Standards

- **Status:** Approved
- **Scope:** Project Foundation and Version 1.0

## Purpose

These standards define the quality gates and engineering conventions for the TypeScript modular monolith. They apply to application code, infrastructure code, tests, scripts, and documentation tooling.

## Required local checks

Before opening a pull request, contributors must run the applicable repository scripts for:

1. Formatting verification
2. Linting
3. Type checking
4. Unit tests
5. Relevant integration/API/architecture/security tests
6. Documentation validation

The eventual package manifest will expose these checks through `npm run` scripts. Tools must not be installed globally.

## Formatting

- Use Prettier as the single formatting authority.
- Formatting must be deterministic and repository-wide.
- Use UTF-8, LF line endings, and four-space indentation only where the language/tooling requires it; TypeScript source follows the approved formatter defaults.
- Use single quotes unless formatter configuration explicitly requires otherwise.
- Require semicolons according to the approved formatter configuration.
- Use trailing commas where supported.
- Do not manually format generated files.
- Formatting-only changes should be isolated from behavioral changes.

## Linting

- Use ESLint for TypeScript linting.
- Lint rules must include correctness, unsafe TypeScript patterns, unused code, import hygiene, and prohibited boundary violations.
- Warnings are not permitted to accumulate; CI must define which warnings, if any, are allowed.
- Disabling a rule requires the narrowest possible scope and an explanatory comment.
- File-wide rule suppression requires reviewer approval.
- Generated files and approved vendor files must be explicitly excluded.

## TypeScript static analysis

- TypeScript strict mode is required.
- `noImplicitAny`, `strictNullChecks`, and related strict checks must remain enabled.
- Avoid `any`; use explicit types, discriminated unions, generics, or runtime validation.
- Avoid unsafe type assertions, especially `as any` and double assertions.
- Public application, domain, infrastructure, and API contracts must have explicit types.
- External input is untrusted until validated.
- Compiler errors are CI failures.
- Type-only imports must be used where supported.

## Code quality

- Business rules belong in application and domain layers.
- Controllers, routes, infrastructure services, and database models must not contain business rules.
- Prefer small cohesive functions and explicit dependencies.
- Avoid hidden global state and implicit side effects.
- Use domain terminology from the SRS.
- Handle errors explicitly; do not swallow exceptions.
- Preserve historical records rather than silently overwriting important data.
- Keep AWS and provider SDK types inside infrastructure adapters.
- Add tests for new behavior and changed behavior.
- Comments should explain non-obvious decisions, not restate code.
