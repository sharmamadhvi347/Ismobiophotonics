import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedAuthException, TokenExpiredException } from '../../../common/exceptions';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    const errorInfo = info as { name?: string } | undefined;
    if (errorInfo?.name === 'TokenExpiredError') {
      throw new TokenExpiredException();
    }
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedAuthException('AUTH_UNAUTHORIZED');
    }
    return user as TUser;
  }
}
