import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../../common/guards';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret =
      configService.get<string>('jwt.accessSecret') ||
      'default-dev-access-secret-minimum-32-characters';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException({
        message: 'AUTH_UNAUTHORIZED',
        error: 'Unauthorized',
        detail: 'Invalid token payload',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        message: 'AUTH_UNAUTHORIZED',
        error: 'Unauthorized',
        detail: 'User belonging to token no longer exists',
      });
    }

    return {
      id: user.id,
      email: user.email,
    };
  }
}
