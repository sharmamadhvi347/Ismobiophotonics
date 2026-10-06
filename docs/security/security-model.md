# Security Model & Engineering Principles

This document formalizes the defensive engineering and security standards governing the Project Management System codebase.

---

## 1. 23 Core Engineering Principles

1. **TypeScript Strict Mode:** Enabled across all workspaces (`apps/*` and `packages/*`).
2. **Avoid `any`:** Disallowed by ESLint rule `@typescript-eslint/no-explicit-any: error`. Explicit typing is mandatory.
3. **No Hardcoded Secrets:** Credentials, keys, and tokens are read exclusively from environment variables.
4. **Environment-Based Configuration:** Validated configuration service with secure defaults and staging/prod overrides.
5. **Authoritative Backend Validation:** Server-side validation via Zod and NestJS `ValidationPipe` is mandatory; client validation is only a UX enhancement.
6. **Never Trust Client-Provided User IDs:** User identity is extracted solely from verified JWT tokens on the server.
7. **Strict Ownership Enforcement:** All mutations and queries filter by the authenticated user's ID.
8. **Never Expose Password Hashes:** Hashes are excluded from Prisma select queries and never returned in API payloads.
9. **Never Expose Tokens in Inappropriate Responses:** Tokens are returned only in dedicated auth responses, never in audit or profile endpoints.
10. **Consistent API Error Format:** All errors follow the `ApiErrorResponse` schema with status code, error type, and timestamp.
11. **Thin Controllers:** Controllers only route requests, parse parameters, and delegate to services.
12. **Domain-Driven Services:** Business rules, validation logic, and access control reside in service layers.
13. **Centralized Error Handling:** Handled via global `HttpExceptionFilter` to prevent information leaks.
14. **Structured Logging:** HTTP methods, paths, status codes, and execution durations logged systematically.
15. **No Silent Error Swallowing:** All rejected promises and caught exceptions are logged with context and re-thrown or handled.
16. **No Unnecessary Dependencies:** Keep dependency trees minimal to minimize supply chain attack surface.
17. **Semantic & Accessible Web UI:** Proper HTML tags, keyboard navigation, and ARIA labels.
18. **Explicit Loading States:** Visual feedback provided for all asynchronous operations.
19. **Explicit Empty States:** Informative empty states when zero projects or tasks exist.
20. **Explicit Error States:** User-friendly messages with retry actions on failure.
21. **Mobile Offline Degradation:** Clear no-network banners instead of application crashes.
22. **Mobile Expired Auth Handling:** Automatic redirection to login screen with user feedback upon token expiry.
23. **Defense in Depth:** Security controls enforced at database, API gateway, and service layers.

---

## 2. Threat Modeling & Mitigation

| Threat Vector                               | Mitigation Strategy                                                                                            |
| :------------------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| **SQL Injection**                           | Prisma ORM parameterizes all SQL queries by default. Raw query strings with user interpolation are prohibited. |
| **Brute Force / Credential Stuffing**       | Rate limiting applied to `/api/auth/login` and `/api/auth/register`.                                           |
| **Mass Assignment**                         | NestJS `ValidationPipe` configured with `whitelist: true` and `forbidNonWhitelisted: true`.                    |
| **Cross-Site Scripting (XSS)**              | React JSX escapes output by default; CORS restrictions configured for API.                                     |
| **Mobile Token Extraction**                 | Hardware-backed keystore/keychain storage using `expo-secure-store`. Unencrypted local storage is prohibited.  |
| **Insecure Direct Object Reference (IDOR)** | Every database query filters by `userId` to ensure users can only access their own records.                    |
