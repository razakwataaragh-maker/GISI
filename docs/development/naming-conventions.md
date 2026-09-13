# GISI Naming Conventions

## Files and directories

- Use lowercase kebab-case for module and directory names.
- Use lowercase kebab-case for documentation and migration filenames.
- Use descriptive names; avoid abbreviations unless they are established domain terms.
- Group files by architectural responsibility: `api`, `application`, `domain`, `infrastructure`, and `tests`.

Examples:

```text
identity-access/
student-profile.service.ts
registration-status.value-object.ts
```

## TypeScript symbols

- Classes, interfaces, types, enums, and namespaces: `PascalCase`.
- Functions, methods, variables, parameters, and properties: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` only for true immutable constants; otherwise use `camelCase`.
- Boolean values should use `is`, `has`, `can`, `should`, or `was` prefixes.
- Factory functions should use `create...`.
- Predicate functions should use `is...`, `has...`, or `can...`.
- Command/use-case names should express an action, such as `ApproveApplication`.
- Query names should express retrieval, such as `GetStudentHistory`.

## API naming

- Use plural resource nouns for collections.
- Use kebab-case URL segments.
- Use explicit action endpoints only for state transitions that are not ordinary CRUD updates.
- Keep API versions explicit and documented.
- Use the SRS status-code and error-contract standards.

## Database naming

- Use snake_case for tables, columns, indexes, and constraints.
- Names must be descriptive and stable.
- Foreign keys and indexes must identify their affected table/columns.
- Migration names must describe the schema change and remain immutable after application.

## Tests

- Test files should describe the subject under test.
- Test names should describe behavior and expected outcome.
- Prefer scenario-oriented names over implementation details.

