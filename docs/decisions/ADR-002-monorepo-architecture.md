# ADR-002: Monorepo Architecture via pnpm Workspaces

## Status

Accepted

## Context

Developing separate repositories for Web, Mobile, and Backend leads to synchronization issues: API contract changes require updating multiple repositories, leading to version mismatches, drift, and high coordination costs.

## Decision

Adopt a single unified monorepo powered by `pnpm` workspaces:

- `apps/api`: NestJS REST backend
- `apps/web`: React + Vite client
- `apps/mobile`: Expo mobile application
- `packages/config`: Shared configuration constants
- `packages/shared-types`: Canonical domain models and DTO interfaces
- `packages/validation`: Unified Zod schemas

## Alternatives Considered

- _Polyrepo (Multiple Repositories):_ Separate Git repositories for api, web, and mobile. Rejected due to drift between contracts and high maintenance overhead for single-team development.
- _Turborepo / Nx:_ Advanced monorepo build systems. Deemed unnecessary for this stage since native `pnpm workspaces` provides fast parallel builds and dependency link management without extra tooling overhead.

## Rationale

pnpm provides hard-linking, preventing duplicated `node_modules` disk usage, fast installations, and native workspace protocol (`workspace:*`) for immediate local type resolution.

## Consequences

- Single commit history reflects full-stack changes atomically.
- Root scripts (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`) provide comprehensive validation in one command.
