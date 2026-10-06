# API Specification & Endpoint Overview

The backend exposes a unified REST API serving both the Web application and Mobile application under the `/api` global prefix.

---

## Interactive Documentation

When running locally, Swagger / OpenAPI interactive documentation is accessible at:

```
http://localhost:3000/api/docs
```

---

## Endpoint Catalog

### System & Health (Module 00 - Active)

- `GET /api/health` — Checks API server uptime and PostgreSQL connection readiness.

### Authentication (Module 01 - Target)

- `POST /api/auth/register` — Registers a new user account.
- `POST /api/auth/login` — Authenticates credentials and issues Access + Refresh tokens.
- `POST /api/auth/logout` — Revokes the active refresh token.
- `GET /api/auth/me` — Retrieves the authenticated user's profile.

### Projects (Module 02 - Target)

- `GET /api/projects` — Lists projects owned by the user (supports search and status filter).
- `GET /api/projects/:id` — Retrieves project details by ID with ownership verification.
- `POST /api/projects` — Creates a new project.
- `PUT /api/projects/:id` — Updates an existing project.
- `DELETE /api/projects/:id` — Deletes a project and cascades deletion to nested tasks.

### Tasks (Module 03 - Target)

- `GET /api/tasks` — Lists tasks owned by the user (supports status, priority, and projectId filters).
- `GET /api/tasks/:id` — Retrieves task details by ID.
- `POST /api/tasks` — Creates a new task under a specific project.
- `PUT /api/tasks/:id` — Updates task attributes, priority, or status.
- `DELETE /api/tasks/:id` — Deletes a task.

### Dashboard (Module 04 - Target)

- `GET /api/dashboard` — Aggregates user metrics (total projects, total tasks, completed, pending, in-progress).
