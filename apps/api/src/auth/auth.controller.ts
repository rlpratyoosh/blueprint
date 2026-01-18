import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Inject,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  AccessTokenPayload,
  AuthService,
  RefreshTokenPayload,
} from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { SetPublic } from 'src/common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import type { LoginUser } from './strategies/local.strategy';
import type { VerifiedUser } from './strategies/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import authConfig from 'src/config/auth.config';

interface LoginUserRequest extends Request {
  user: LoginUser;
}

export interface VerifiedUserRequest extends Request {
  user: VerifiedUser;
  cookies: Record<string, string | undefined>;
}

export interface RequestWCookies extends Request {
  cookies: Record<string, string | undefined>;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
  ) {}

  @SetPublic()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Req() req: LoginUserRequest,
  ) {
    if (
      !req.user.otp ||
      !req.user.otpExpiry ||
      req.user.otpExpiry.getTime() < Date.now()
    )
      throw new ForbiddenException('Invalid or Expired OTP');

    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
    );
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { message: 'Login successful' };
  }

  @SetPublic()
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.authService.register(registerUserDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async signOut(
    @Req() req: VerifiedUserRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];

    if (refreshToken) await this.authService.logout(refreshToken);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Logged Out Succesfully' };
  }

  @Post('logoutall')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: VerifiedUserRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;
    if (userId) await this.authService.logoutAll(userId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Logged Out From All Devices' };
  }

  @SetPublic()
  @UseGuards(AuthGuard('local'))
  @Post('sendotp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Req() req: LoginUserRequest) {
    await this.authService.sendOtp(req.user);

    return { message: 'OTP successfully sent!' };
  }

  @Get('me')
  async getMe(@Req() req: VerifiedUserRequest) {
    return this.authService.getMe(req.user.userId);
  }

  @Post('session')
  @SetPublic()
  @HttpCode(HttpStatus.OK)
  async checkSession(
    @Req() req: RequestWCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldAccessToken = req.cookies['access_token'];
    const oldRefreshToken = req.cookies['refresh_token'];

    if (!oldAccessToken && !oldRefreshToken)
      throw new UnauthorizedException('No Session');

    try {
      const payload: AccessTokenPayload = this.jwt.verify(
        oldAccessToken as string,
        {
          secret: this.auth.secret,
        },
      );

      return {
        id: payload.sub,
        userType: payload.userType,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      if (!oldRefreshToken) throw new UnauthorizedException('Session Invalid');
      try {
        const payload: RefreshTokenPayload = this.jwt.verify(oldRefreshToken, {
          secret: this.auth.secret,
        });
        const { accessToken, refreshToken, user } =
          await this.authService.refresh(
            payload.sub,
            oldRefreshToken,
            payload.tokenId,
          );
        res.cookie('access_token', accessToken, {
          httpOnly: true,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000,
        });
        res.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
          id: user.id,
          userType: user.userType,
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        throw new UnauthorizedException('Session Expired');
      }
    }
  }
}
