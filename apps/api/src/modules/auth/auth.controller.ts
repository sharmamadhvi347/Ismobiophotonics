import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { AuthenticatedUser } from '../../common/guards';
import { AuthResponse, SafeUser } from '@pms/shared-types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Creates a new user with email, full name, and password. Returns access and rotating refresh tokens.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully with auth tokens',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed on email, name, or password strength',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'An account with this email already exists',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Authenticate with email and password',
    description:
      'Validates user credentials and issues a fresh short-lived JWT access token and rotating refresh token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully authenticated with auth tokens',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid email or password',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Rotate refresh token and issue new token pair',
    description:
      'Validates the refresh token, revokes it atomically, issues a new token pair, and detects token reuse.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token successfully rotated',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid, expired, or reused refresh token',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Rate limit exceeded',
  })
  async refresh(@Body() dto: RefreshDto): Promise<AuthResponse> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revoke active refresh token session',
    description: 'Revokes specified or all active refresh tokens for the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing bearer token',
  })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: LogoutDto,
  ): Promise<{ message: string }> {
    return this.authService.logout(user.id, dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current authenticated user profile',
    description:
      'Returns the authenticated user details (id, email, fullName, timestamps) without sensitive fields.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile returned',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid, expired, or missing bearer token',
  })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<SafeUser> {
    return this.authService.getMe(user.id);
  }
}
