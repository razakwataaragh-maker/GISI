# GISI Service Registration Standards

## Service registration

Every registered service must have:

- A clear ownership layer
- An explicit interface where it crosses a boundary
- A documented lifecycle scope
- A defined configuration dependency
- A defined failure policy
- A close/disposal strategy where applicable
- Unit and integration-test substitution support

## Service scopes

- `singleton`: process/application-wide stateless or safely shared service.
- `factory`: creates scoped resources such as transactions or request contexts.
- `request`: request-specific context and principal data.
- `transient`: short-lived pure object with no external resource.

Services must not rely on undocumented scope behavior.

## Ownership examples

| Service                 | Owner                    | Scope              |
| ----------------------- | ------------------------ | ------------------ |
| Configuration           | Bootstrap                | Singleton          |
| Logger factory          | Infrastructure/bootstrap | Singleton          |
| Database client         | Infrastructure           | Singleton          |
| Repository              | Module infrastructure    | Application-scoped |
| Use-case service        | Module application       | Application-scoped |
| Authenticated principal | API/request context      | Request            |
| Unit of work            | Database/application     | Factory/request    |
| Clock                   | Shared/bootstrap         | Singleton          |

## Prohibited registration

- Global mutable registries
- Hidden service locators
- Concrete provider clients in domain constructors
- Duplicate database or logger clients without an approved reason
- Registration based on unreviewed filesystem scanning
