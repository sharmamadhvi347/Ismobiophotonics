/**
 * Common Guards
 * Foundation for JWT authentication, refresh token guards, and ownership checks.
 * Concrete implementation will be wired in Module 01 (Auth).
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
}
