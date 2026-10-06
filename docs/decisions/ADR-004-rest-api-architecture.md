# ADR-004: RESTful API and Envelope Standard

## Status

Accepted

## Context

The assessment requires a single unified backend serving both Web and Mobile clients. Client applications need predictable serialization, reliable error parsing, and interactive API documentation.

## Decision

Adopt a standard RESTful architecture with:

1. Canonical HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
2. Global response envelope interceptor (`TransformInterceptor`):
   ```json
   { "success": true, "data": ..., "timestamp": "ISO-STRING" }
   ```
3. Global error envelope filter (`HttpExceptionFilter`):
   ```json
   {
     "success": false,
     "statusCode": 400,
     "error": "...",
     "message": "...",
     "timestamp": "...",
     "path": "..."
   }
   ```
4. Swagger / OpenAPI 3.0 specification generated dynamically at `/api/docs`.

## Alternatives Considered

- _GraphQL:_ Offers flexible querying, but adds schema complexity, client caching challenges, and higher operational overhead for standard CRUD operations.
- _Raw Unwrapped JSON:_ Inconsistent error shapes between framework errors and application responses make client parsing brittle.

## Rationale

REST with predictable envelopes allows both Web (fetch/axios) and Mobile (React Native) clients to share identical response-handling interceptors and type definitions. Swagger ensures interactive contract inspection for evaluators.

## Consequences

- Requires frontend API clients to unwrap `response.data.data` or use an axios response unwrapper.
- Clear and predictable error messages simplify UI alert handling.
