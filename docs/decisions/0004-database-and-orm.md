# ADR 0004: PostgreSQL and Prisma

- **Status:** Accepted
- **Date:** 2026-09-13

## Decision

Use PostgreSQL 16 or later as the primary database and Prisma as the type-safe data-access and migration tool.

## Rationale

- PostgreSQL is mandated by the SRS.
- Foreign keys, constraints, transactions, indexes, and strong consistency support historical preservation and financial integrity.
- Prisma provides generated TypeScript types, explicit migrations, and a productive repository implementation.
- Prisma's transaction APIs support application-layer transaction boundaries.

## Alternatives rejected

- **MongoDB:** document flexibility does not fit the SRS emphasis on relational integrity, ledgers, foreign keys, and historical traceability.
- **TypeORM:** viable, but Prisma provides stronger generated type contracts and a simpler migration workflow for this baseline.
- **Knex:** flexible, but requires more manual typing and repository conventions.

## Constraints

Prisma models and repositories must not contain business rules. Module ownership, constraints, and migrations remain explicit. Important records must not be silently overwritten.
