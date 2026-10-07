import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResponse, SafeUser } from '@pms/shared-types';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockSafeUser: SafeUser = {
    id: 'user-uuid-1',
    email: 'engineer@example.com',
    fullName: 'Staff Engineer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockAuthResponse: AuthResponse = {
    user: mockSafeUser,
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  };

  const mockAuthService = {
    register: jest.fn().mockResolvedValue(mockAuthResponse),
    login: jest.fn().mockResolvedValue(mockAuthResponse),
    refresh: jest.fn().mockResolvedValue(mockAuthResponse),
    logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
    getMe: jest.fn().mockResolvedValue(mockSafeUser),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should delegate to authService.register and return AuthResponse', async () => {
      const dto = {
        email: 'engineer@example.com',
        fullName: 'Staff Engineer',
        password: 'Password123!',
      };

      const result = await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should delegate to authService.login and return AuthResponse', async () => {
      const dto = {
        email: 'engineer@example.com',
        password: 'Password123!',
      };

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refresh', () => {
    it('should delegate to authService.refresh and return rotated tokens', async () => {
      const dto = { refreshToken: 'valid-token' };

      const result = await controller.refresh(dto);

      expect(service.refresh).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should delegate to authService.logout with user id and optional dto', async () => {
      const user = { id: 'user-uuid-1', email: 'engineer@example.com' };
      const dto = { refreshToken: 'token-to-revoke' };

      const result = await controller.logout(user, dto);

      expect(service.logout).toHaveBeenCalledWith(user.id, dto);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getMe', () => {
    it('should delegate to authService.getMe with current authenticated user id', async () => {
      const user = { id: 'user-uuid-1', email: 'engineer@example.com' };

      const result = await controller.getMe(user);

      expect(service.getMe).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(mockSafeUser);
    });
  });
});
