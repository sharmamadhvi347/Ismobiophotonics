/**
 * Minimal JWT Access Token Claims
 * Security principle: Do not embed passwords, sensitive info, or refresh tokens into access tokens.
 */
export interface JwtPayload {
  sub: string; // User ID
  iat?: number;
  exp?: number;
}
