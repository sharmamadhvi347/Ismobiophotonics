/**
 * Common Decorators
 * Foundation for current user injection, public route markers, and custom validation decorators.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../guards';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    return request.user;
  },
);
