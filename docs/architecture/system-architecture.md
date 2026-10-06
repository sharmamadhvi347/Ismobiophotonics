# System Architecture Document

**Project:** Project Management System (PMS) — Web + Mobile  
**Author:** Senior Software Architect + Staff Full-Stack Engineer  
**Stage:** Module 00 — Engineering Foundation

---

## 1. Product Overview

The Project Management System (PMS) is a secure, cross-platform productivity application designed for managing projects, organizing hierarchically nested tasks, monitoring progress, and surfacing real-time workspace metrics through an interactive dashboard.

The application serves both **Web** (desktop/browser) and **Mobile** (Android primary, iOS secondary) clients from a **single authoritative REST backend API** and a **centralized relational database (PostgreSQL)**. Any state mutation originating on Web reflects immediately on Mobile (and vice versa) upon data re-fetch / pull-to-refresh.

---

## 2. System Goals

1. **Unified State & Single Source of Truth:** One authoritative backend serves both clients; no duplicated or disparate mobile-specific APIs.
2. **Zero-Trust Resource Isolation:** Strict multi-tenant isolation where users can only view, mutate, or delete resources they explicitly own. Client-provided user identifiers are never trusted.
3. **Type Safety Across Boundaries:** Monorepo architecture sharing TypeScript domain types, contract interfaces, and validation rules across client and server workspaces.
4. **Resilience & Defensiveness:** Explicit error boundaries, graceful offline/network failure degradation on mobile, and rate limiting to prevent brute-force attacks.
5. **Observability & Auditability:** Structured HTTP logging, correlation ID tracing, and audit trail capture for destructive or sensitive operations.

---

## 3. Web → API → Database Flow

```
[ Browser Client (React + Vite) ]
               │
               ▼  HTTPS / JSON
     [ Reverse Proxy / CORS ]
               │
               ▼
[ Global Pipes / Validation (Zod/Class-Validator) ]
               │
               ▼
[ Auth Guard & Interceptors (JWT Bearer Token) ]
               │
               ▼
   [ NestJS Controllers (Thin Route Adapters) ]
               │
               ▼
   [ Domain Services (Business Logic & Ownership) ]
               │
               ▼
   [ Prisma ORM (Type-Safe Query Parameterization) ]
               │
               ▼  TCP / SQL Connection Pool
     [ PostgreSQL Database ]
```

---

## 4. Mobile → API → Database Flow

```
[ Android / iOS Mobile Client (React Native + Expo) ]
               │
        [ Secure Store (Encrypted Keystore / Keychain) ]
               │ (Injects Bearer Access Token)
               ▼  HTTPS / JSON
     [ Unified NestJS REST API Gateway ]
               │
               ▼
[ Authentication Guard (Validates Signature & Expiration) ]
               │
               ▼
   [ Domain Services (Enforces User-Scoped Queries) ]
               │
               ▼
   [ PostgreSQL Database (ACID Relational Persistence) ]
```

---

## 5. Modular Monolith Architecture

The backend adopts a **modular monolith** topology:

- **High Cohesion, Low Coupling:** Each business domain (Auth, Users, Projects, Tasks, Dashboard, Audit) resides in its own isolated module under `apps/api/src/modules/`.
- **In-Process Boundary Calls:** Cross-module interactions occur via explicitly exported service interfaces and dependency injection, avoiding premature microservice distributed networking overhead.
- **Independent Evolution:** Modules maintain single-responsibility boundaries, enabling a direct transition to microservices in the future if organizational scaling requires it.

---

## 6. Authentication Boundary

- **Mechanism:** Asymmetric/symmetric JSON Web Tokens (JWT) with separate short-lived Access Tokens (15 min) and long-lived Refresh Tokens (7 days).
- **Storage Strategy:**
  - _Web Client:_ Secure HttpOnly, SameSite cookies or memory-stored access tokens with refresh token rotation.
  - _Mobile Client:_ Encrypted hardware-backed hardware storage (`expo-secure-store` leveraging Android Keystore and iOS Keychain). Never stored in unencrypted `AsyncStorage` or browser `localStorage`.
- **Token Verification:** NestJS Passport/JWT AuthGuards extract the token, verify signature against the secret, and attach the verified identity (`req.user = { id, email }`) to the execution context.
- **Revocation:** Refresh tokens are hashed using SHA-256 and stored in the database with revocation tracking (`revokedAt`).

---

## 7. Authorization Boundary

- **Ownership Invariance:** Every query to fetch, mutate, or delete a Project or Task automatically constrains by `userId = req.user.id`.
- **Indirect Traversal Protection:** Tasks must belong to a project owned by the caller. Path traversal (e.g., deleting another user's task ID) yields a strict `404 Not Found` or `403 Forbidden` response.
- **Client Disregard:** The backend never extracts user IDs from query parameters or request bodies to establish identity.

---

## 8. Validation Boundary

- **Defense-in-Depth:** Input validation occurs both client-side (for responsive user feedback) and server-side (as the ultimate source of truth).
- **Zod Schemas:** Defined in `packages/validation/`, schemas enforce strict typing, length constraints, email formats, and date ordering.
- **Whitelist Enforcement:** NestJS `ValidationPipe` is set to `whitelist: true` and `forbidNonWhitelisted: true`, rejecting unexpected payload properties to prevent prototype pollution or mass-assignment attacks.

---

## 9. Error Handling Boundary

- **Centralized Exception Filter:** `HttpExceptionFilter` captures all standard `HttpException` instances and unhandled runtime exceptions.
- **Consistent Envelope:** All error responses adhere to the standard `ApiErrorResponse` schema:
  ```json
  {
    "success": false,
    "statusCode": 400,
    "error": "Bad Request",
    "message": ["Project name cannot be empty"],
    "timestamp": "2026-10-06T18:00:00.000Z",
    "path": "/api/projects"
  }
  ```
- **Information Leakage Prevention:** Internal server errors (500) do not leak SQL stack traces, database credentials, or internal file paths to clients.

---

## 10. Logging & Observability Strategy

- **Structured HTTP Interceptor:** `LoggingInterceptor` intercepts all inbound requests and outbound responses, recording HTTP method, path, status code, IP, and execution latency.
- **Correlation Tracking:** `CorrelationIdMiddleware` ensures every request carries an `x-correlation-id` header across the request lifecycle.
- **Audit Trails:** Critical state changes (e.g., entity creation, updates, and deletions) write audit records to the `audit_logs` table.

---

## 11. Deployment Architecture

- **Backend API:** Containerized Node.js service running on a production PaaS (Render / Railway / AWS ECS).
- **Database:** Managed PostgreSQL instance with automated backups, connection pooling, and SSL required.
- **Web Client:** Static asset bundle built via Vite and distributed globally through Vercel / Netlify / Cloudflare Pages CDN.
- **Mobile Client:** Standalone release APK generated via Expo Application Services (EAS Build) and distributed for Android devices.

---

## 12. Security Principles

1. **Zero Trust:** Assume all client inputs are untrusted and potentially malicious.
2. **Password Cryptography:** Passwords hashed with bcrypt (minimum 12 salt rounds); plain-text passwords are never persisted or logged.
3. **No Secret Leakage:** Git history and codebases must never contain secrets; all configuration is injected via environment variables.
4. **SQL Injection Immunity:** All database access is governed by Prisma ORM prepared statements.
5. **Rate Limiting:** Protect auth routes from credential stuffing and brute-force attacks.

---

## 13. Technology Decisions Rationale

### Why PostgreSQL?

PostgreSQL provides bulletproof ACID compliance, robust foreign key constraint enforcement, relational indexing (`B-tree` on user and project foreign keys), and support for JSONB payloads (ideal for audit log metadata).

### Why NestJS?

NestJS introduces opinionated, enterprise-grade architecture out of the box: dependency injection, declarative route decorators, modular encapsulation, built-in exception filters, interceptors, and seamless OpenAPI/Swagger generation.

### Why React?

React remains the industry-standard UI library with unparalleled ecosystem support, component reusability, and efficient DOM reconciliation, perfectly aligned with Vite's lightning-fast compilation.

### Why React Native + Expo?

Expo allows creating a single TypeScript codebase that compiles into native Android APKs and iOS binaries. It provides production-ready APIs for hardware-backed secure storage (`expo-secure-store`) and robust developer tooling.

### Why Prisma?

Prisma delivers end-to-end type safety between the PostgreSQL schema and TypeScript codebase, prevents SQL injection by default, handles migrations deterministically, and integrates smoothly with NestJS.

### Why Monorepo?

A monorepo orchestrated with pnpm workspaces eliminates code drift between clients and server. Types, validation schemas, and configurations are shared directly without publishing intermediate npm packages.

---

## 14. Architecture Status & Roadmap

| Subsystem       | Component                         | Status             | Notes                                              |
| :-------------- | :-------------------------------- | :----------------- | :------------------------------------------------- |
| **Repository**  | pnpm Monorepo Workspace           | **Implemented**    | Root configs, tsconfig, prettier, eslint           |
| **Tooling**     | CI Pipeline (.github/workflows)   | **Implemented**    | Automated lint, typecheck, test, build             |
| **Database**    | Prisma Schema & Docker Compose    | **Implemented**    | Postgres 16 container, core schema definitions     |
| **Shared**      | @pms/config                       | **Implemented**    | System constants & token expirations               |
| **Shared**      | @pms/shared-types                 | **Implemented**    | Domain interfaces, DTOs, API envelopes             |
| **Shared**      | @pms/validation                   | **Implemented**    | Zod input validation schemas                       |
| **Backend**     | NestJS Core Architecture          | **Implemented**    | Filters, Interceptors, Pipes, Swagger, HealthCheck |
| **Backend**     | Health & Readiness Endpoint       | **Implemented**    | `/api/health` with automated unit tests            |
| **Web**         | React + Vite Foundation           | **Implemented**    | TypeScript strict mode, responsive layout skeleton |
| **Mobile**      | React Native + Expo Foundation    | **Implemented**    | Android-ready, Expo config, structure skeleton     |
| **Auth**        | User Registration & JWT Login     | _Planned (Mod 01)_ | bcrypt, access/refresh tokens, guards              |
| **Projects**    | Project Management CRUD           | _Planned (Mod 02)_ | Scoped queries, ownership validation               |
| **Tasks**       | Task Management CRUD              | _Planned (Mod 03)_ | Priority/Status filters, project nesting           |
| **Dashboard**   | Metrics Aggregation               | _Planned (Mod 04)_ | User-scoped counts and performance metrics         |
| **Mobile Sync** | Secure Storage & Offline Fallback | _Planned (Mod 05)_ | expo-secure-store, NetInfo, pull-to-refresh        |
