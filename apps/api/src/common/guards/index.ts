/**
 * Common Guards
 * Foundation for JWT authentication, refresh token guards, and ownership checks.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export * from '../../modules/auth/guards/jwt-auth.guard';
