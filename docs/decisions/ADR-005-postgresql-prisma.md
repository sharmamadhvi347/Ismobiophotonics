# ADR-005: Relational Persistence with PostgreSQL and Prisma ORM

## Status

Accepted

## Context

Project and Task management inherently requires strict relational structures: users own projects, projects contain tasks, and tasks inherit project context. Cascade deletion, unique constraints on user emails, and ACID transaction guarantees are mandatory.

## Decision

Adopt **PostgreSQL** (version 16) managed via **Prisma ORM**:

- Declarative schema in `prisma/schema.prisma`.
- Fully typed Prisma Client for database interactions.
- Relational foreign key constraints with `onDelete: Cascade` for referential integrity.
- Indexes on foreign keys (`userId`, `projectId`) to guarantee high-performance query execution.

## Alternatives Considered

- _TypeORM:_ Widely used with NestJS, but prone to leaky abstractions, synchronization bugs, and loose runtime typing compared to Prisma.
- _Drizzle ORM:_ Lightweight SQL builder, but Prisma provides superior DX, introspection, and established database migration workflows for this assessment.
- _MongoDB:_ Non-relational; does not enforce relational integrity at the engine level.

## Rationale

Prisma generates TypeScript types directly from the database schema, eliminating impedance mismatch between database tables and application logic. It automatically parameterizes all SQL queries, preventing SQL injection vulnerabilities.

## Consequences

- Requires running `prisma generate` whenever `schema.prisma` is modified.
- Local development requires a running PostgreSQL instance (orchestrated via `docker compose up -d`).
