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

### Projects (Module 02 - Active)

All project endpoints require authentication via Bearer JWT (`Authorization: Bearer <accessToken>`). User ownership is automatically enforced; requests are strictly scoped to the authenticated user.

#### 1. Create Project

- **Method & Path:** `POST /api/projects`
- **Auth:** Bearer JWT required
- **Request Body:**
  ```json
  {
    "name": "Project Alpha",
    "description": "Core infrastructure revamp",
    "status": "NOT_STARTED",
    "startDate": "2026-10-01",
    "endDate": "2026-12-31"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-v4",
      "name": "Project Alpha",
      "description": "Core infrastructure revamp",
      "status": "NOT_STARTED",
      "startDate": "2026-10-01T00:00:00.000Z",
      "endDate": "2026-12-31T00:00:00.000Z",
      "userId": "user-uuid",
      "createdAt": "2026-10-07T12:00:00.000Z",
      "updatedAt": "2026-10-07T12:00:00.000Z"
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `BAD_REQUEST` (400 - missing name, invalid dates, startDate > endDate), `AUTH_UNAUTHORIZED` (401).

#### 2. List Projects (with Search, Filter, Pagination, and Sorting)

- **Method & Path:** `GET /api/projects`
- **Auth:** Bearer JWT required
- **Query Parameters:**
  - `page` (optional integer, default `1`, min `1`)
  - `pageSize` (optional integer, default `20`, max `100`)
  - `limit` (optional integer, alias for `pageSize`)
  - `search` (optional string, case-insensitive match on project name)
  - `status` (optional enum: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
  - `sortBy` (optional enum: `createdAt`, `name`, `startDate`, `endDate`, `status`, default `createdAt`)
  - `sortOrder` (optional enum: `asc`, `desc`, default `desc`)
- **Example:** `GET /api/projects?search=alpha&status=IN_PROGRESS&page=1&pageSize=20&sortBy=createdAt&sortOrder=desc`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "uuid-v4",
          "name": "Project Alpha",
          "description": "Core infrastructure revamp",
          "status": "IN_PROGRESS",
          "startDate": "2026-10-01T00:00:00.000Z",
          "endDate": "2026-12-31T00:00:00.000Z",
          "userId": "user-uuid",
          "createdAt": "2026-10-07T12:00:00.000Z",
          "updatedAt": "2026-10-07T12:00:00.000Z"
        }
      ],
      "meta": {
        "total": 1,
        "page": 1,
        "pageSize": 20,
        "limit": 20,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
      }
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `AUTH_UNAUTHORIZED` (401), `BAD_REQUEST` (400).

#### 3. Get Single Project

- **Method & Path:** `GET /api/projects/:id`
- **Auth:** Bearer JWT required
- **Path Parameters:**
  - `id` (UUID v4 of the project)
- **Response (200 OK):** Returns single `Project` object inside success envelope.
- **Error Codes:** `NOT_FOUND` (404 - project not found or not owned by user), `AUTH_UNAUTHORIZED` (401).

#### 4. Update Project

- **Method & Path:** `PUT /api/projects/:id`
- **Auth:** Bearer JWT required
- **Path Parameters:**
  - `id` (UUID v4 of the project)
- **Request Body:** Partial update fields (`name`, `description`, `status`, `startDate`, `endDate`).
- **Response (200 OK):** Returns updated `Project` object.
- **Error Codes:** `BAD_REQUEST` (400 - invalid date relationship or malformed input), `NOT_FOUND` (404 - project not found or not owned by user), `AUTH_UNAUTHORIZED` (401).

#### 5. Delete Project

- **Method & Path:** `DELETE /api/projects/:id`
- **Auth:** Bearer JWT required
- **Path Parameters:**
  - `id` (UUID v4 of the project)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "success": true,
      "message": "Project deleted successfully"
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `NOT_FOUND` (404 - project not found or not owned by user), `AUTH_UNAUTHORIZED` (401).

---

### Tasks (Module 03 - Active)

All task endpoints require authentication via Bearer JWT (`Authorization: Bearer <accessToken>`). User and project ownership are automatically verified; access across tenants or unauthorized projects safely returns 404 (`ResourceNotFoundException`), preventing IDOR and ID enumeration attacks.

#### 1. Create Task Under Project

- **Method & Path:** `POST /api/projects/:projectId/tasks`
- **Auth:** Bearer JWT required
- **Path Parameters:**
  - `projectId` (UUID v4 of the parent project)
- **Request Body:**
  ```json
  {
    "name": "Implement JWT refresh rotation",
    "description": "Add sliding window and family revocation to refresh tokens.",
    "priority": "HIGH",
    "status": "PENDING",
    "dueDate": "2026-10-25"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "task-uuid-v4",
      "name": "Implement JWT refresh rotation",
      "description": "Add sliding window and family revocation to refresh tokens.",
      "priority": "HIGH",
      "status": "PENDING",
      "dueDate": "2026-10-25T00:00:00.000Z",
      "projectId": "project-uuid-v4",
      "userId": "user-uuid-v4",
      "createdAt": "2026-10-07T12:00:00.000Z",
      "updatedAt": "2026-10-07T12:00:00.000Z"
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `BAD_REQUEST` (400 - missing name, invalid due date), `NOT_FOUND` (404 - project not found or not owned by user), `AUTH_UNAUTHORIZED` (401).

#### 2. List Tasks for a Project (with Search, Filter, Pagination, and Sorting)

- **Method & Path:** `GET /api/projects/:projectId/tasks`
- **Auth:** Bearer JWT required
- **Path Parameters:**
  - `projectId` (UUID v4 of the parent project)
- **Query Parameters:**
  - `page` (optional integer, default `1`, min `1`)
  - `pageSize` (optional integer, default `20`, max `100`)
  - `limit` (optional integer, alias for `pageSize`)
  - `search` (optional string, case-insensitive match on task name or description)
  - `status` (optional enum: `PENDING`, `IN_PROGRESS`, `COMPLETED`)
  - `priority` (optional enum: `LOW`, `MEDIUM`, `HIGH`)
  - `sortBy` (optional enum: `createdAt`, `name`, `dueDate`, `priority`, `status`, default `createdAt`)
  - `sortOrder` (optional enum: `asc`, `desc`, default `desc`)
- **Example:** `GET /api/projects/:projectId/tasks?search=JWT&status=PENDING&priority=HIGH&page=1&pageSize=20&sortBy=dueDate&sortOrder=asc`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "task-uuid-v4",
          "name": "Implement JWT refresh rotation",
          "description": "Add sliding window and family revocation to refresh tokens.",
          "priority": "HIGH",
          "status": "PENDING",
          "dueDate": "2026-10-25T00:00:00.000Z",
          "projectId": "project-uuid-v4",
          "userId": "user-uuid-v4",
          "createdAt": "2026-10-07T12:00:00.000Z",
          "updatedAt": "2026-10-07T12:00:00.000Z"
        }
      ],
      "meta": {
        "total": 1,
        "page": 1,
        "pageSize": 20,
        "limit": 20,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
      }
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `NOT_FOUND` (404 - project not found or not owned by user), `AUTH_UNAUTHORIZED` (401).

#### 3. List All Tasks Across User Projects

- **Method & Path:** `GET /api/tasks`
- **Auth:** Bearer JWT required
- **Query Parameters:** Same as project task list, plus optional `projectId` filter.
- **Response (200 OK):** Paginated task list scoped to the authenticated user.
- **Error Codes:** `AUTH_UNAUTHORIZED` (401), `NOT_FOUND` (404 - if specified `projectId` does not exist or belong to user).

#### 4. Create Task (Direct Endpoint)

- **Method & Path:** `POST /api/tasks`
- **Auth:** Bearer JWT required
- **Request Body:** Requires `projectId` in body payload alongside task attributes.
- **Response (201 Created):** Same payload as `POST /api/projects/:projectId/tasks`.
- **Error Codes:** `BAD_REQUEST` (400 - missing projectId or validation failure), `NOT_FOUND` (404 - project not found or not owned by user), `AUTH_UNAUTHORIZED` (401).

#### 5. Get Single Task by ID

- **Method & Path:** `GET /api/tasks/:id`
- **Auth:** Bearer JWT required
- **Path Parameters:**
  - `id` (UUID v4 of the task)
- **Response (200 OK):** Returns single `Task` object.
- **Error Codes:** `NOT_FOUND` (404 - task not found or not owned by user), `AUTH_UNAUTHORIZED` (401).

#### 6. Update Task

- **Method & Path:** `PUT /api/tasks/:id`
- **Auth:** Bearer JWT required
- **Path Parameters:**
  - `id` (UUID v4 of the task)
- **Request Body:** Partial update fields (`name`, `description`, `priority`, `status`, `dueDate`). Reassignment of `projectId` or `userId` is strictly disallowed.
- **Response (200 OK):** Returns updated `Task` object.
- **Error Codes:** `BAD_REQUEST` (400 - malformed date or validation failure), `NOT_FOUND` (404 - task not found or not owned by user), `AUTH_UNAUTHORIZED` (401).

#### 7. Delete Task

- **Method & Path:** `DELETE /api/tasks/:id`
- **Auth:** Bearer JWT required
- **Path Parameters:**
  - `id` (UUID v4 of the task)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "success": true,
      "message": "Task deleted successfully"
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `NOT_FOUND` (404 - task not found or not owned by user), `AUTH_UNAUTHORIZED` (401).

---

### Dashboard (Module 04 - Active)

#### 1. Get Workspace Dashboard Metrics

- **Method & Path:** `GET /api/dashboard`
- **Auth:** Bearer JWT required (`Authorization: Bearer <accessToken>`)
- **Description:** Aggregates high-level project and task metrics strictly scoped to the authenticated user.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalProjects": 5,
      "totalTasks": 12,
      "completedTasks": 7,
      "pendingTasks": 3,
      "projectsInProgress": 2
    },
    "timestamp": "2026-10-07T12:00:00.000Z"
  }
  ```
- **Error Codes:** `AUTH_UNAUTHORIZED` (401).
