/**
 * Common Exceptions
 * Domain-specific exceptions for ownership, resource conflicts, and validation.
 */

import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

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
  constructor(email: string) {
    super(`A user with email '${email}' already exists`);
  }
}
