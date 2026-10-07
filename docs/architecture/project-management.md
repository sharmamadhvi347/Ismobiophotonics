# Project Management Architecture & Domain Model

This document outlines the architectural design, ownership enforcement, query semantics, and security guarantees implemented in Module 02 (Project Management).

---

## 1. Domain Model & Lifecycle

A **Project** represents a high-level operational container owned exclusively by an authenticated user. Every project progresses through a deterministic lifecycle:

```
  ┌─────────────┐       ┌─────────────┐       ┌───────────┐
  │ NOT_STARTED │ ────> │ IN_PROGRESS │ ────> │ COMPLETED │
  └─────────────┘       └─────────────┘       └───────────┘
```

### Attributes:

- `id` (UUID v4): Unique identifier.
- `userId` (UUID v4): Foreign key referencing `User.id`. Cascades on user deletion.
- `name` (String): Required, trimmed, 1–120 characters.
- `description` (String, optional): Trimmed, up to 1000 characters.
- `status` (Enum: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`): Defaults to `NOT_STARTED`.
- `startDate` (DateTime, optional): Project initiation boundary.
- `endDate` (DateTime, optional): Project completion target boundary.
- `createdAt` / `updatedAt` (DateTime): Automated timestamps.

---

## 2. Ownership & Insecure Direct Object Reference (IDOR) Mitigation

### Strict Identity Source

- All operations derive user identity exclusively from the validated JWT token (`@CurrentUser() user: AuthenticatedUser`).
- Under no circumstances is a `userId` accepted from the request body, headers, or query parameters.

### Multi-Tenant Isolation & Anti-Enumeration

To prevent IDOR vulnerabilities:

1. **Query Scoping:** List operations (`GET /api/projects`) always include `where: { userId: currentUserId }` in the Prisma query.
2. **Safe 404 on Unauthorized Access:** Single-resource operations (`GET`, `PUT`, `DELETE /api/projects/:id`) verify ownership. If the project belongs to another user, the API throws `ResourceNotFoundException('Project', id)` (HTTP 404). This prevents attackers from probing whether arbitrary project IDs exist.

---

## 3. Date Validation Rules

To preserve chronological integrity:

- `startDate <= endDate`: When both dates are provided, `startDate` cannot exceed `endDate`.
- **Cross-Field Update Validation:** When updating only `startDate`, it is validated against the existing `endDate`. When updating only `endDate`, it is validated against the existing `startDate`.
- Rejections produce HTTP 400 (`BAD_REQUEST`) with descriptive validation messages.

---

## 4. Query Architecture: Search, Filtering, Pagination, and Sorting

### Case-Insensitive Search

Search queries (`?search=term`) perform case-insensitive substring matching on `name`:

```typescript
where.name = {
  contains: search.trim(),
  mode: 'insensitive',
};
```

### Deterministic Sorting Allowlist

To prevent SQL injection or unindexed arbitrary database operations, sorting is strictly constrained to an allowlist:

- Allowed sort keys: `createdAt`, `name`, `startDate`, `endDate`, `status`.
- Ordering: `asc` or `desc` (defaults to `desc`).
- Default: `createdAt desc`.

### Safe Pagination

- Standard parameters: `page` (1-indexed, default: `1`), `pageSize` / `limit` (default: `20`, capped at `100`).
- Offset calculation: `skip = (page - 1) * pageSize`, `take = pageSize`.
- Returns metadata: `total`, `page`, `pageSize`, `limit`, `totalPages`, `hasNextPage`, `hasPrevPage`.

---

## 5. Database Schema & Indexing

In `prisma/schema.prisma`:

- `@@index([userId])`: Ensures efficient user-scoped queries and joins.
- `onDelete: Cascade` on `Task.projectId`: Deleting a project safely and automatically cascades deletion to child tasks without leaving orphaned records.
