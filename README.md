# Project Management System (PMS)

A professional full-stack Project Management System spanning Web and Mobile (Android primary), powered by a unified NestJS REST API and PostgreSQL database.

> **Status:** Module 00 (Engineering Foundation) Complete. Business feature implementation is tracked stage-by-stage.

---

## Overview

The Project Management System is designed to provide project and task organization across desktop and mobile devices. It guarantees absolute single-source-of-truth data synchronization: a task created or updated on Web is immediately visible on Mobile upon refresh, and vice versa.

### Key Capabilities

- **Unified Backend:** Single REST API serving both web and mobile clients.
- **Relational Integrity:** Strict user-scoped resource isolation, foreign key cascading, and database indexing.
- **Cross-Platform Parity:** Shared TypeScript types, validation rules, and business constants across all applications.
- **Defensive Engineering:** Strict TypeScript compilation, automated error formatting, structured logging, and token encryption.

---

## Requirements

### Functional Scope

- **User Authentication:** User registration, login, logout, and token expiration handling. (_Implementation in progress - Module 01_)
- **Project Management:** Create, view, edit, and delete user-owned projects with statuses (`Not Started`, `In Progress`, `Completed`). (_Implementation in progress - Module 02_)
- **Task Management:** Manage tasks under projects with priorities (`Low`, `Medium`, `High`) and statuses (`Pending`, `In Progress`, `Completed`). (_Implementation in progress - Module 03_)
- **Dashboard:** Real-time metrics reflecting total projects, total tasks, completed, pending, and in-progress projects. (_Implementation in progress - Module 04_)
- **Search & Filtering:** Search projects/tasks by name; filter by status and priority. (_Implementation in progress - Modules 02-04_)
- **Mobile Experience:** Native Android app with secure token storage (Android Keystore), pull-to-refresh synchronization, and offline network state detection. (_Implementation in progress - Module 05_)

---

## Architecture

The project employs a **Modular Monolith** pattern within a **pnpm Monorepo**:

```
[ Web Client: React + Vite ]       [ Mobile App: React Native + Expo ]
                 │                                  │
                 └───────────────┬──────────────────┘
                                 │ HTTPS / REST
                                 ▼
                     [ API Gateway / NestJS ]
                     ├── AuthModule (Planned)
                     ├── ProjectsModule (Planned)
                     ├── TasksModule (Planned)
                     ├── DashboardModule (Planned)
                     └── HealthModule (Active)
                                 │
                                 ▼
                      [ Prisma ORM Client ]
                                 │
                                 ▼
                     [ PostgreSQL 16 Database ]
```

Detailed architectural specifications:

- [System Architecture Specification](docs/architecture/system-architecture.md)
- [Architecture Decision Records (ADRs)](docs/decisions/)
- [System Diagrams](docs/diagrams/architecture-diagram.md)

---

## Technology Stack

| Layer          | Technology           | Rationale                                                                     |
| :------------- | :------------------- | :---------------------------------------------------------------------------- |
| **Monorepo**   | pnpm Workspaces      | Fast package linking, zero phantom dependencies, deterministic locking        |
| **Backend**    | NestJS + TypeScript  | Enterprise modular architecture, dependency injection, OpenAPI generation     |
| **Database**   | PostgreSQL 16        | Relational ACID guarantees, cascade constraints, JSONB metadata indexing      |
| **ORM**        | Prisma ORM           | End-to-end type safety, automated query parameterization, seamless migrations |
| **Web**        | React 18 + Vite + TS | High performance, strict type checking, rapid build times                     |
| **Mobile**     | React Native + Expo  | Native Android APK generation, secure hardware keystore storage               |
| **Validation** | Zod                  | Universal schema validation shared between server and clients                 |
| **Testing**    | Jest                 | Backend unit and integration testing                                          |
| **CI/CD**      | GitHub Actions       | Automated linting, typechecking, testing, and workspace builds                |

---

## Repository Structure

```
ismobiophotonics/
├── apps/
│   ├── api/                 # NestJS REST API application
│   ├── web/                 # React + Vite web client
│   └── mobile/              # React Native + Expo mobile application
├── packages/
│   ├── config/              # Shared application constants and configs
│   ├── shared-types/        # Canonical TypeScript domain types & DTOs
│   └── validation/          # Shared Zod validation schemas
├── docs/
│   ├── architecture/        # System design & architecture documents
│   ├── decisions/           # Architecture Decision Records (ADRs 001 - 006)
│   ├── diagrams/            # Mermaid diagrams (C4, ERD, flowcharts)
│   ├── api/                 # REST API specifications and OpenAPI details
│   └── security/            # Security model and 23 engineering principles
├── prisma/
│   └── schema.prisma        # Canonical PostgreSQL database schema
├── tests/
│   └── e2e/                 # End-to-end testing specifications
├── .github/
│   └── workflows/ci.yml     # Automated CI pipeline
├── .env.example             # Documented environment variables template
├── .gitignore               # Multi-platform git ignore rules
├── docker-compose.yml       # Local PostgreSQL database container configuration
├── pnpm-workspace.yaml      # Monorepo workspace configuration
├── tsconfig.base.json       # Monorepo root TypeScript strict configuration
└── package.json             # Root workspace orchestration scripts
```

---

## Prerequisites

Ensure your system meets the following prerequisites:

- **Node.js:** `>= 20.0.0` (LTS recommended)
- **pnpm:** `>= 9.0.0` (`corepack enable && corepack prepare pnpm@latest --activate` or `npm i -g pnpm`)
- **Docker & Docker Compose:** Optional for running local PostgreSQL container
- **Git:** `>= 2.40.0`

---

## Local Development

### 1. Clone & Install

```bash
git clone https://github.com/sharmamadhvi347/Ismobiophotonics.git
cd Ismobiophotonics
pnpm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

### 3. Spin Up Local Database

```bash
docker compose up -d
```

### 4. Generate Prisma Client

```bash
pnpm db:generate
```

### 5. Launch Applications

```bash
# Run NestJS REST API (http://localhost:3000/api)
pnpm dev:api

# Run Web Client (http://localhost:5173)
pnpm dev:web

# Run Mobile Client (Expo Dev Server)
pnpm dev:mobile
```

---

## Environment Variables

The project uses `.env.example` as the authoritative reference:

| Variable                 | Description                           | Example / Default                                                     |
| :----------------------- | :------------------------------------ | :-------------------------------------------------------------------- |
| `NODE_ENV`               | Runtime environment                   | `development`                                                         |
| `PORT`                   | API server port                       | `3000`                                                                |
| `DATABASE_URL`           | PostgreSQL connection string          | `postgresql://postgres:postgres@localhost:5432/pms_dev?schema=public` |
| `POSTGRES_USER`          | Container PostgreSQL username         | `postgres`                                                            |
| `POSTGRES_PASSWORD`      | Container PostgreSQL password         | `postgres`                                                            |
| `POSTGRES_DB`            | Container database name               | `pms_dev`                                                             |
| `JWT_ACCESS_SECRET`      | Secret key for access token signing   | _Min 32-char random string_                                           |
| `JWT_REFRESH_SECRET`     | Secret key for refresh token signing  | _Min 32-char random string_                                           |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifespan                 | `15m`                                                                 |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan                | `7d`                                                                  |
| `WEB_ORIGIN`             | Allowed CORS origin for web app       | `http://localhost:5173`                                               |
| `API_URL`                | Backend URL for mobile app connection | `http://localhost:3000`                                               |

---

## Database

The PostgreSQL schema is managed via Prisma in `prisma/schema.prisma`.

### Key Entities

- `User`: Accounts with encrypted credentials and audit relationships.
- `Project`: User-owned projects with start/end scheduling and status tracking.
- `Task`: Child entities linked to projects and users with priorities and statuses.
- `RefreshToken`: Cryptographic token hashes for refresh rotation and revocation.
- `AuditLog`: Action audit trail recording sensitive entity mutations.

---

## Web Application

- **Technology:** React 18, Vite, TypeScript (Strict).
- **Architecture:** Feature-based modular directories (`components/`, `features/`, `layouts/`, `pages/`, `hooks/`, `services/`, `lib/`, `types/`, `utils/`).
- **Status:** Foundation initialized. (_Business UI implementation in progress - Module 02-04_)

---

## Mobile Application

- **Technology:** React Native, Expo SDK 52, TypeScript.
- **Target Platform:** Android (Required), iOS (Compatible).
- **Security:** `expo-secure-store` leveraging hardware-backed Android Keystore.
- **Status:** Foundation initialized. (_Business UI and network sync implementation in progress - Module 05_)

---

## Backend

- **Technology:** NestJS 11, Express, TypeScript.
- **Architectural Highlights:**
  - Global standard exception filter (`HttpExceptionFilter`)
  - Global response transform interceptor (`TransformInterceptor`)
  - Structured request logging (`LoggingInterceptor`)
  - Global validation pipe with whitelist enforcement
  - Swagger OpenAPI interactive documentation at `/api/docs`
- **Status:** Foundation active with operational `/api/health` readiness check.

---

## Testing

Run workspace verification commands:

```bash
# Run all tests across packages and apps
pnpm test

# Run ESLint across all workspaces
pnpm lint

# Run strict TypeScript typechecking
pnpm typecheck

# Build all packages and applications
pnpm build
```

---

## Documentation

- [System Architecture](docs/architecture/system-architecture.md)
- [Security Model & 23 Principles](docs/security/security-model.md)
- [Architecture Decision Records (ADRs)](docs/decisions/)
- [API Specifications](docs/api/api-overview.md)
- [Mermaid Diagrams](docs/diagrams/architecture-diagram.md)

---

## Security

1. **Zero Client Trust:** All authorization boundaries check ownership on the server.
2. **Password Hashing:** Passwords hashed with bcrypt (12 salt rounds); never stored in plain text.
3. **Hardware Storage on Mobile:** Android Keystore used for tokens; never unencrypted local storage.
4. **SQL Parameterization:** Prisma ORM eliminates raw SQL injection vectors.
5. **Rate Limiting:** Auth endpoints will enforce rate limits against brute-force attacks.

---

## Deployment

- **Backend API:** Containerized deployment on Render / Railway with managed PostgreSQL.
- **Web Client:** Static asset bundle deployed on Vercel / Netlify CDN.
- **Mobile App:** Production standalone Android APK built via Expo EAS.

---

## Git Workflow

The project follows a strict module-by-module feature branch strategy:

1. Feature branches created from `main`: `feat/<module-name>` (e.g. `feat/00-foundation`).
2. Quality gates must pass before committing:
   `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
3. Atomic commit on feature branch.
4. Feature branch pushed to origin and verified.
5. Fast-forward or clean merge into `main`.
6. Version tag created and pushed (e.g., `v0.1.0-foundation`).
