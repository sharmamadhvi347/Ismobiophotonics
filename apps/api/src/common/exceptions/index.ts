/**
 * Common Exceptions
 * Domain-specific exceptions for authentication, ownership, resource conflicts, and validation.
 */

import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string, id: string) {
    super(`${resource} with ID '${id}' was not found`);
  }
}

export class ResourceForbiddenException extends ForbiddenException {
  constructor(action = 'access this resource') {
    super(`You do not have permission to ${action}`);
  }
}

export class EmailAlreadyExistsException extends ConflictException {
  constructor(_email?: string) {
    super({
      message: 'AUTH_EMAIL_ALREADY_EXISTS',
      error: 'Conflict',
      detail: 'An account with this email already exists',
    });
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      message: 'AUTH_INVALID_CREDENTIALS',
      error: 'Unauthorized',
      detail: 'Invalid email or password',
    });
  }
}

export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super({
      message: 'AUTH_TOKEN_EXPIRED',
      error: 'Unauthorized',
      detail: 'Authentication token has expired',
    });
  }
}

export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super({
      message: 'AUTH_INVALID_REFRESH_TOKEN',
      error: 'Unauthorized',
      detail: 'Provided refresh token is invalid',
    });
  }
}

export class RefreshTokenReusedException extends UnauthorizedException {
  constructor() {
    super({
      message: 'AUTH_REFRESH_TOKEN_REUSED',
      error: 'Unauthorized',
      detail: 'Revoked refresh token reuse detected; all sessions revoked',
    });
  }
}

export class UnauthorizedAuthException extends UnauthorizedException {
  constructor(message = 'AUTH_UNAUTHORIZED') {
    super({
      message,
      error: 'Unauthorized',
    });
  }
}
