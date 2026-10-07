import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { AuthResponse, AuthTokens, SafeUser } from '@pms/shared-types';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  InvalidRefreshTokenException,
  RefreshTokenReusedException,
  TokenExpiredException,
  UnauthorizedAuthException,
} from '../../common/exceptions';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user with unique email and bcrypt-hashed password
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      this.logger.warn(
        `[SECURITY] USER_REGISTRATION_FAILED email_already_exists email=${normalizedEmail}`,
      );
      throw new EmailAlreadyExistsException(normalizedEmail);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: dto.fullName.trim(),
        passwordHash,
      },
    });

    const tokens = await this.generateTokens(user.id);

    this.logger.log(`[SECURITY] USER_REGISTERED userId=${user.id} email=${user.email}`);

    return {
      user: this.formatSafeUser(user),
      tokens,
    };
  }

  /**
   * Authenticate user with email and password
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      this.logger.warn(
        `[SECURITY] USER_LOGIN_FAILURE reason=user_not_found email=${normalizedEmail}`,
      );
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`[SECURITY] USER_LOGIN_FAILURE reason=invalid_password userId=${user.id}`);
      throw new InvalidCredentialsException();
    }

    const tokens = await this.generateTokens(user.id);

    this.logger.log(`[SECURITY] USER_LOGIN_SUCCESS userId=${user.id}`);

    return {
      user: this.formatSafeUser(user),
      tokens,
    };
  }

  /**
   * Rotate refresh token and issue new token pair with reuse detection
   */
  async refresh(dto: RefreshDto): Promise<AuthResponse> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      this.logger.warn(`[SECURITY] TOKEN_REFRESH_REJECTED reason=token_not_found`);
      throw new InvalidRefreshTokenException();
    }

    // Token Reuse Detection: If a previously revoked token is presented, compromise is suspected
    if (storedToken.revokedAt !== null) {
      this.logger.error(
        `[SECURITY] TOKEN_REUSE_DETECTED userId=${storedToken.userId} tokenId=${storedToken.id}`,
      );
      // Invalidate all active sessions for this user immediately
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new RefreshTokenReusedException();
    }

    // Expiration verification
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      this.logger.warn(
        `[SECURITY] TOKEN_REFRESH_REJECTED reason=token_expired userId=${storedToken.userId}`,
      );
      throw new TokenExpiredException();
    }

    if (!storedToken.user) {
      this.logger.warn(
        `[SECURITY] TOKEN_REFRESH_REJECTED reason=user_missing userId=${storedToken.userId}`,
      );
      throw new UnauthorizedAuthException('AUTH_UNAUTHORIZED');
    }

    // Atomic rotation: revoke old token and create new refresh token
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const refreshExpiresInMs = this.getRefreshExpiresInMs();
    const newExpiresAt = new Date(Date.now() + refreshExpiresInMs);

    const [, newAccessToken] = await Promise.all([
      this.prisma.$transaction([
        this.prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date() },
        }),
        this.prisma.refreshToken.create({
          data: {
            tokenHash: newTokenHash,
            userId: storedToken.userId,
            expiresAt: newExpiresAt,
          },
        }),
      ]),
      this.signAccessToken(storedToken.userId),
    ]);

    this.logger.log(`[SECURITY] TOKEN_REFRESH_SUCCESS userId=${storedToken.userId}`);

    return {
      user: this.formatSafeUser(storedToken.user),
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken,
      },
    };
  }

  /**
   * Terminate user session and revoke refresh tokens
   */
  async logout(userId: string, dto?: LogoutDto): Promise<{ message: string }> {
    if (dto?.refreshToken) {
      const tokenHash = this.hashToken(dto.refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    this.logger.log(`[SECURITY] USER_LOGOUT userId=${userId}`);
    return { message: 'Logged out successfully' };
  }

  /**
   * Get authenticated user profile (safe attributes only)
   */
  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`[SECURITY] GET_ME_FAILED reason=user_not_found userId=${userId}`);
      throw new UnauthorizedAuthException('AUTH_UNAUTHORIZED');
    }

    return this.formatSafeUser(user);
  }

  /**
   * Generate an access token and a hashed refresh token session
   */
  private async generateTokens(userId: string): Promise<AuthTokens> {
    const accessToken = await this.signAccessToken(userId);

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiresInMs = this.getRefreshExpiresInMs();
    const expiresAt = new Date(Date.now() + refreshExpiresInMs);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Sign a JWT access token containing only minimal claims { sub: userId }
   */
  private async signAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId },
      {
        secret:
          this.configService.get<string>('jwt.accessSecret') ||
          'default-dev-access-secret-minimum-32-characters',
        expiresIn: (this.configService.get<string>('jwt.accessExpiresIn') ||
          '15m') as JwtSignOptions['expiresIn'],
      },
    );
  }

  /**
   * Computes a SHA-256 hash of a raw token string
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parses configured refresh expiration string (e.g., '7d', '24h', '60m') to milliseconds
   */
  private getRefreshExpiresInMs(): number {
    const rawExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const match = /^(\d+)([dhms])?$/i.exec(rawExpiresIn);

    if (!match || !match[1]) {
      return 7 * 24 * 60 * 60 * 1000; // default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2]?.toLowerCase() || 'd';

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Format Prisma user to SafeUser (excluding passwordHash)
   */
  private formatSafeUser(user: {
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
    updatedAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
