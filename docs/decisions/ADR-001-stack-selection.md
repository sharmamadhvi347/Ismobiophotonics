# ADR-001: Technology Stack Selection

## Status

Accepted

## Context

The technical assessment mandates building a full-stack cross-platform Project Management System spanning Web and Mobile (Android primary). The platform must demonstrate professional engineering standards, strict security, type safety, maintainability, and clean architectural boundaries.

## Decision

We select the following technology stack:

- **Language:** TypeScript across all workspaces in strict mode.
- **Backend:** NestJS on Node.js.
- **Database & ORM:** PostgreSQL with Prisma ORM.
- **Web Frontend:** React 18 with Vite.
- **Mobile Frontend:** React Native with Expo (Android priority).
- **Package Manager:** pnpm with pnpm workspaces.
- **Validation:** Zod for shared runtime schema validation.

## Alternatives Considered

- _Backend:_ Express.js (minimalist, but lacks enterprise dependency injection, modular structure, and native OpenAPI integration out-of-the-box).
- _Web:_ Next.js (powerful for SSR/SEO, but introduces unnecessary server-side rendering complexity for a private authenticated project management portal; Vite delivers faster client-only build times and simpler static deployment).
- _Mobile:_ Flutter (strong multiplatform capabilities, but prevents code/type sharing with the TypeScript backend and React web client).
- _Database:_ MongoDB (NoSQL lacks relational foreign key constraint guarantees needed for strict project-task ownership hierarchies).

## Rationale

Using TypeScript across Web, Mobile, and Backend maximizes code reuse (shared types, DTOs, and validation schemas), reduces context switching, and prevents serialization bugs. NestJS provides enterprise-grade modular architecture, and Expo ensures rapid Android APK builds.

## Consequences

- Single language ecosystem simplifies developer onboarding and testing tooling.
- Requires monorepo orchestration to ensure build and dependency synchrony.
