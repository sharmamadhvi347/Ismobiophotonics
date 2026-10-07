import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenExpiredException, UnauthorizedAuthException } from '../../../common/exceptions';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should return user if user is present without error', () => {
    const user = { id: 'u1', email: 'test@example.com' };
    const result = guard.handleRequest(null, user, null, mockContext);
    expect(result).toBe(user);
  });

  it('should throw TokenExpiredException if info indicates TokenExpiredError', () => {
    expect(() => {
      guard.handleRequest(
        null,
        false,
        { name: 'TokenExpiredError', message: 'jwt expired' },
        mockContext,
      );
    }).toThrow(TokenExpiredException);
  });

  it('should throw UnauthorizedAuthException if user is missing', () => {
    expect(() => {
      guard.handleRequest(null, false, null, mockContext);
    }).toThrow(UnauthorizedAuthException);
  });

  it('should rethrow err if err is present', () => {
    const customErr = new Error('Custom auth error');
    expect(() => {
      guard.handleRequest(customErr, false, null, mockContext);
    }).toThrow(customErr);
  });
});
