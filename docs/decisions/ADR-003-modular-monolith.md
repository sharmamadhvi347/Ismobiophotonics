# ADR-003: Modular Monolith Architecture for Backend

## Status

Accepted

## Context

When designing backend systems, teams frequently prematurely split into microservices, incurring distributed systems complexities such as network latency, distributed transactions, service discovery, and container orchestration overhead (e.g. Kubernetes).

## Decision

Implement a **Modular Monolith** using NestJS modules:

- Independent domain modules: Auth, Users, Projects, Tasks, Dashboard, Audit.
- In-process dependency injection between modules.
- Enforced architectural layers: Controllers (thin routing) -> Services (business logic & ownership enforcement) -> Persistence (Prisma ORM).

## Alternatives Considered

- _Microservices:_ Separate services for Auth, Projects, and Tasks communicating via gRPC or message queues. Rejected as premature optimization and contrary to architectural requirements.
- _Unstructured Monolith (Express spaghetti):_ Flat route handlers directly performing database queries. Rejected due to tight coupling and poor testability.

## Rationale

A modular monolith provides clean module boundaries, high cohesion, low coupling, deterministic local development, and zero network serialization overhead while preserving the ability to extract modules into microservices if needed later.

## Consequences

- Fast deployment and straightforward testing.
- Developers must maintain strict module isolation and avoid direct cross-boundary database mutations.
