import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import authConfig from 'src/config/auth.config';
import { Request } from 'express';
import { prisma } from '@repo/db';
import type { AccessTokenPayload } from '../auth.service';

interface JWTRequest extends Request {
  cookies: Record<string, string | undefined>;
}

export type VerifiedUser = Omit<
  AccessTokenPayload,
  'payloadType' | 'sub' | 'isVerified'
> & {
  userId: AccessTokenPayload['sub'];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: auth.secret,
    });
  }

  private static extractJWT(this: void, req: JWTRequest): string | null {
    if (
      req.cookies &&
      'access_token' in req.cookies &&
      (req.cookies.access_token as string).length > 0
    ) {
      return req.cookies.access_token as string;
    }
    return null;
  }

  async validate(payload: AccessTokenPayload): Promise<VerifiedUser> {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) throw new UnauthorizedException('User not found');

    if (!user.isVerified) throw new ForbiddenException('User is not verified');

    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      userType: payload.userType,
    };
  }
}
