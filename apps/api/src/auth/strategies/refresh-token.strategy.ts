import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import authConfig from 'src/config/auth.config';
import { RefreshTokenPayload } from '../auth.service';

interface JwtRefreshRequest extends Request {
  cookies: Record<string, string | undefined>;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: JwtRefreshRequest) => {
          return req?.cookies?.refresh_token as string;
        },
      ]),
      secretOrKey: auth.secret,
      passReqToCallback: true,
    });
  }

  validate(req: JwtRefreshRequest, payload: RefreshTokenPayload) {
    const refreshToken = req.cookies.refresh_token as string;
    return { ...payload, refreshToken };
  }
}

export type ValidatedRefreshToken = Omit<RefreshTokenPayload, 'payloadType'> & {
  refreshToken: string;
};
