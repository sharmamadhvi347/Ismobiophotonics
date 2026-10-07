import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  InvalidRefreshTokenException,
  RefreshTokenReusedException,
  TokenExpiredException,
  UnauthorizedAuthException,
} from '../../common/exceptions';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockDate = new Date('2026-10-07T12:00:00.000Z');
  const mockFutureDate = new Date('2026-10-14T12:00:00.000Z');
  const mockPastDate = new Date('2026-10-01T12:00:00.000Z');

  const mockUser = {
    id: 'user-uuid-1',
    email: 'engineer@example.com',
    fullName: 'Staff Engineer',
    passwordHash: '$2a$12$e0X7m1sA9cQf...',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-jwt-access-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const config: Record<string, unknown> = {
        'jwt.accessSecret': 'test-access-secret-minimum-32-chars-long',
        'jwt.refreshSecret': 'test-refresh-secret-minimum-32-chars-long',
        'jwt.accessExpiresIn': '15m',
        'jwt.refreshExpiresIn': '7d',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.$transaction.mockImplementation((callbackOrPromises: unknown) => {
      if (Array.isArray(callbackOrPromises)) {
        return Promise.all(callbackOrPromises);
      }
      return (callbackOrPromises as (tx: unknown) => Promise<unknown>)(mockPrismaService);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user, hash password with 12 rounds, and return tokens', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'token-1' });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pwd');

      const result = await service.register({
        email: '  Engineer@Example.COM  ',
        fullName: 'Staff Engineer',
        password: 'SecurePassword123!',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'engineer@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePassword123!', 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'engineer@example.com',
          fullName: 'Staff Engineer',
          passwordHash: 'hashed-pwd',
        },
      });
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();

      expect(result).toHaveProperty('user');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      });
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.tokens).toHaveProperty('accessToken', 'mock-jwt-access-token');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(typeof result.tokens.refreshToken).toBe('string');
    });

    it('should throw EmailAlreadyExistsException if email is already taken', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'engineer@example.com',
          fullName: 'Staff Engineer',
          password: 'SecurePassword123!',
        }),
      ).rejects.toThrow(EmailAlreadyExistsException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials and return tokens', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'token-1' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: '  ENGINEER@EXAMPLE.COM  ',
        password: 'ValidPassword123!',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'engineer@example.com' },
      });
      expect(result.user.id).toBe(mockUser.id);
      expect(result.tokens.accessToken).toBe('mock-jwt-access-token');
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw InvalidCredentialsException if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(InvalidCredentialsException);
    });

    it('should throw InvalidCredentialsException if password does not match', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'engineer@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(InvalidCredentialsException);
    });
  });

  describe('refresh token rotation & reuse detection', () => {
    it('should rotate valid refresh token atomically', async () => {
      const storedToken = {
        id: 'token-uuid-1',
        tokenHash: 'somehash',
        userId: mockUser.id,
        user: mockUser,
        revokedAt: null,
        expiresAt: mockFutureDate,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(storedToken);
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({
        ...storedToken,
        revokedAt: new Date(),
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'token-uuid-2' });

      const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

      expect(prisma.refreshToken.findUnique).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.tokens.accessToken).toBe('mock-jwt-access-token');
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should throw InvalidRefreshTokenException if token is not found', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.refresh({ refreshToken: 'unknown-token' })).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('should detect token reuse and revoke ALL active tokens for user when revoked token presented', async () => {
      const revokedToken = {
        id: 'token-uuid-revoked',
        tokenHash: 'revokedhash',
        userId: mockUser.id,
        user: mockUser,
        revokedAt: new Date('2026-10-06T10:00:00.000Z'),
        expiresAt: mockFutureDate,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(revokedToken);

      await expect(service.refresh({ refreshToken: 'stolen-revoked-token' })).rejects.toThrow(
        RefreshTokenReusedException,
      );

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw TokenExpiredException if refresh token is expired', async () => {
      const expiredToken = {
        id: 'token-uuid-expired',
        tokenHash: 'expiredhash',
        userId: mockUser.id,
        user: mockUser,
        revokedAt: null,
        expiresAt: mockPastDate,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(expiredToken);
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({
        ...expiredToken,
        revokedAt: new Date(),
      });

      await expect(service.refresh({ refreshToken: 'expired-token' })).rejects.toThrow(
        TokenExpiredException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke specific refresh token if provided', async () => {
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.logout(mockUser.id, {
        refreshToken: 'specific-token-to-revoke',
      });

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: expect.any(String),
          userId: mockUser.id,
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should revoke all active user tokens if no specific token provided', async () => {
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.logout(mockUser.id);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getMe', () => {
    it('should return safe user profile without passwordHash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getMe(mockUser.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        createdAt: mockUser.createdAt.toISOString(),
        updatedAt: mockUser.updatedAt.toISOString(),
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedAuthException if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getMe('nonexistent-id')).rejects.toThrow(UnauthorizedAuthException);
    });
  });
});
