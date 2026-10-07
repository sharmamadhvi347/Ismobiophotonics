# API Specification & Endpoint Overview

The backend exposes a unified REST API serving both the Web application and Mobile application under the `/api` global prefix.

---

## Interactive Documentation

When running locally, Swagger / OpenAPI interactive documentation is accessible at:

```
http://localhost:3000/api/docs
```

---

## Standard Response Envelopes

### Success Envelope

All successful responses are automatically enveloped by `TransformInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-07T12:00:00.000Z"
}
```

### Error Envelope

All exceptions are intercepted and formatted consistently by `HttpExceptionFilter`:

```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "AUTH_INVALID_CREDENTIALS",
  "timestamp": "2026-10-07T12:00:00.000Z",
  "path": "/api/auth/login"
}
```

---

## Endpoint Catalog

### System & Health (Module 00 - Active)

- `GET /api/health` — Checks API server uptime and PostgreSQL connection readiness.

---

### Authentication & Sessions (Module 01 - Active)

#### 1. Register User

- **Method & Path:** `POST /api/auth/register`
- **Rate Limit:** 10 requests / minute
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "engineer@example.com",
    "fullName": "Staff Engineer",
    "password": "SecurePassword123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid-v4",
        "email": "engineer@example.com",
        "fullName": "Staff Engineer",
        "createdAt": "2026-10-07T12:00:00.000Z",
        "updatedAt": "2026-10-07T12:00:00.000Z"
      },
      "tokens": {
        "accessToken": "eyJhbGciOi...",
        "refreshToken": "40-byte-hex-string"
      }
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `AUTH_EMAIL_ALREADY_EXISTS` (409), `BAD_REQUEST` (400), `RATE_LIMIT_EXCEEDED` (429).

#### 2. Login

- **Method & Path:** `POST /api/auth/login`
- **Rate Limit:** 10 requests / minute
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "engineer@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):** Same payload structure as registration.
- **Error Codes:** `AUTH_INVALID_CREDENTIALS` (401), `RATE_LIMIT_EXCEEDED` (429).

#### 3. Refresh Token Rotation

- **Method & Path:** `POST /api/auth/refresh`
- **Rate Limit:** 10 requests / minute
- **Auth:** Public (validated via refresh token hash)
- **Request Body:**
  ```json
  {
    "refreshToken": "40-byte-hex-string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": { ... },
      "tokens": {
        "accessToken": "new-jwt-access-token",
        "refreshToken": "new-rotating-refresh-token"
      }
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `AUTH_INVALID_REFRESH_TOKEN` (401), `AUTH_TOKEN_EXPIRED` (401), `AUTH_REFRESH_TOKEN_REUSED` (401), `RATE_LIMIT_EXCEEDED` (429).

#### 4. Logout

- **Method & Path:** `POST /api/auth/logout`
- **Auth:** Bearer JWT required (`Authorization: Bearer <accessToken>`)
- **Request Body (optional):**
  ```json
  {
    "refreshToken": "40-byte-hex-string"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out successfully"
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `AUTH_UNAUTHORIZED` (401).

#### 5. Current Authenticated User Profile

- **Method & Path:** `GET /api/auth/me`
- **Auth:** Bearer JWT required (`Authorization: Bearer <accessToken>`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-v4",
      "email": "engineer@example.com",
      "fullName": "Staff Engineer",
      "createdAt": "2026-10-07T12:00:00.000Z",
      "updatedAt": "2026-10-07T12:00:00.000Z"
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `AUTH_UNAUTHORIZED` (401), `AUTH_TOKEN_EXPIRED` (401).

---

### Projects (Module 02 - Target)

- `GET /api/projects` — Lists projects owned by the user (supports search and status filter).
- `GET /api/projects/:id` — Retrieves project details by ID with ownership verification.
- `POST /api/projects` — Creates a new project.
- `PUT /api/projects/:id` — Updates an existing project.
- `DELETE /api/projects/:id` — Deletes a project and cascades deletion to nested tasks.

---

### Tasks (Module 03 - Target)

- `GET /api/tasks` — Lists tasks owned by the user (supports status, priority, and projectId filters).
- `GET /api/tasks/:id` — Retrieves task details by ID.
- `POST /api/tasks` — Creates a new task under a specific project.
- `PUT /api/tasks/:id` — Updates task attributes, priority, or status.
- `DELETE /api/tasks/:id` — Deletes a task.

---

### Dashboard (Module 04 - Target)

- `GET /api/dashboard` — Aggregates user metrics (total projects, total tasks, completed, pending, in-progress).
