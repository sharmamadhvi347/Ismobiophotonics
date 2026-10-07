# Task Management Architecture & Design Specification

## Overview

The Task Management subsystem (Module 03) delivers high-performance, strictly isolated task lifecycle management within the Project Management System (PMS). Every task is an entity attached to a parent `Project`, which in turn belongs to an authenticated `User`.

---

## Data Model & Relational Integrity

### PostgreSQL / Prisma Schema

```prisma
model Task {
  id          String       @id @default(uuid())
  name        String
  description String?
  priority    TaskPriority @default(MEDIUM)
  status      TaskStatus   @default(PENDING)
  dueDate     DateTime?
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([projectId])
  @@index([userId])
  @@map("tasks")
}
```

### Key Design Highlights:

1. **Cascade Deletion:** When a parent `Project` is deleted, all child `Task` records are automatically removed by PostgreSQL (`onDelete: Cascade`), preventing orphan records.
2. **Denormalized `userId` Index:** While tasks belong to projects, indexing and storing `userId` directly on `Task` allows fast $O(1)$ user-task ownership checks and high-throughput multi-project task aggregation without heavy table joins.
3. **Compound Foreign Keys & Indices:** `[projectId]` and `[userId]` maintain dedicated B-tree indices ensuring index scans for filtered lookups and pagination.

---

## Authorization & IDOR Defenses

Cross-tenant data exposure and Insecure Direct Object References (IDOR) are prevented through an explicit multi-layer authorization protocol:

```
[Incoming Request]
        |
        v
[JwtAuthGuard] -> Extracts verified user identity (userId)
        |
        +---> [Parent Project Verification]:
        |     Queries project where { id: projectId, userId }.
        |     If missing or belonging to another user:
        |     --> Throws ResourceNotFoundException (HTTP 404).
        |
        +---> [Task Record Verification]:
        |     Queries task where { id: taskId, userId }.
        |     If missing or belonging to another user:
        |     --> Throws ResourceNotFoundException (HTTP 404).
```

### Safe 404 Protocol

To prevent attacker enumeration of project and task UUIDs, unauthorized access attempts return standard HTTP 404 (`ResourceNotFoundException`) rather than HTTP 403. An attacker cannot differentiate between an ID that does not exist and an ID owned by another user.

### Immutability of Project & User Identity

On updates (`PUT /api/tasks/:id`), client payloads cannot modify `projectId` or `userId`. Relocating tasks across projects or reassigning ownership is strictly rejected.

---

## Search, Filtering, and Pagination

1. **Filtering:**
   - `status`: Supported values `PENDING`, `IN_PROGRESS`, `COMPLETED`.
   - `priority`: Supported values `LOW`, `MEDIUM`, `HIGH`.
   - `search`: Case-insensitive substring matching (`mode: 'insensitive'`) applied across both `name` and `description` via an `OR` compound filter.
2. **Sorting Allowlist:**
   - Whitelist: `createdAt`, `name`, `dueDate`, `priority`, `status`.
   - Direction: `asc`, `desc`.
   - Default: `createdAt desc`.
3. **Pagination Envelope:**
   - Bounded page sizes (1 to 100, default 20) with standard metadata:
     - `total`, `page`, `pageSize`, `limit`, `totalPages`, `hasNextPage`, `hasPrevPage`.
