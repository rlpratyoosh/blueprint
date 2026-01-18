import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { ValidatedUser } from '../auth.service';

interface LoginRequest extends Request {
  body: {
    otp: string;
  };
}

export type LoginUser = NonNullable<ValidatedUser> & { otp: string };

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username',
      passReqToCallback: true,
    });
  }

  async validate(
    req: LoginRequest,
    username: string,
    password: string,
  ): Promise<LoginUser> {
    const user: ValidatedUser = await this.authService.validateUser(
      username,
      password,
    );
    if (!user) throw new UnauthorizedException('Invalid Credentials');

    const otp = req.body.otp;

    return {
      ...user,
      otp,
    };
  }
}
