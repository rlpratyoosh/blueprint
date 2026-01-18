import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import authConfig from 'src/config/auth.config';
import { prisma } from '@repo/db';
import { RegisterUserDto } from './dto/register-user.dto';
import { HashingProvider } from './providers/hashing.provider';
import type { User } from '@repo/db';
import { LoginUser } from './strategies/local.strategy';
import { PrismaClientKnownRequestError } from 'node_modules/@repo/db/dist/generated/prisma/internal/prismaNamespace';
import { REDIS_CLIENT } from 'src/common/redis/redis.module';
import Redis from 'ioredis';
import { Prisma } from '@repo/db';

export type ValidatedUser = Omit<User, 'password'> | null;

type UserWProfile = Omit<
  Prisma.UserGetPayload<{
    include: {
      profile: true;
    };
  }>,
  'password'
>;

export type AccessTokenPayload = {
  sub: string;
  username: string;
  email: string;
  userType: string;
  isVerified: boolean;
  payloadType: 'ACCESS';
};

export type RefreshTokenPayload = {
  sub: string;
  payloadType: 'REFRESH';
  tokenId: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingProvider: HashingProvider,
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
    private readonly jwt: JwtService,
    private readonly mailService: MailerService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<ValidatedUser> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (user) {
      const isMatch = await this.hashingProvider.compare(
        password,
        user.password,
      );
      if (isMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }

    return null;
  }

  async login(user: LoginUser) {
    const isMatch = await this.hashingProvider.compare(
      user.otp,
      user.hashedOtp as string,
    );

    if (!isMatch) throw new ForbiddenException('Invalid OTP');

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedOtp: null,
        otpExpiry: null,
        otpCreatedAt: null,
        isVerified: true,
      },
    });

    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: randomUUID(),
      },
    });

    const tokens = await this.generateTokens(updatedUser, refreshToken.id);
    const hashedRefreshToken = await this.hashingProvider.hash(
      tokens.refreshToken,
    );

    await prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { token: hashedRefreshToken },
    });

    return tokens;
  }

  async register(registerUserDto: RegisterUserDto) {
    const data = {
      ...registerUserDto,
      password: await this.hashingProvider.hash(registerUserDto.password),
    };

    let user: User;
    try {
      user = await prisma.user.create({
        data: {
          ...data,
          profile: {
            create: {
              displayName: data.username,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new BadRequestException('User already exists');
      // console.log(error); // For Debugging
      throw new InternalServerErrorException('Something went wrong');
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const hashedOtp = await this.hashingProvider.hash(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 10000);
    const now = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: { hashedOtp, otpExpiry, otpCreatedAt: now },
    });

    const message = `Your OTP is: ${otp}`;

    await this.sendMail(message, user.email);

    return { message: 'Registration Successful' };
  }

  async refresh(userId: string, refreshToken: string, tokenId: string) {
    const [user, hashedRefreshToken] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.refreshToken.findUnique({ where: { id: tokenId } }),
    ]);

    if (!user) throw new ForbiddenException('Access Denied!');

    if (!hashedRefreshToken || !(hashedRefreshToken.userId === userId))
      throw new ForbiddenException('Access Denied!');

    const isMatch = await this.hashingProvider.compare(
      refreshToken,
      hashedRefreshToken.token,
    );
    if (!isMatch) throw new ForbiddenException('Access Denied!');

    const tokens = await this.generateTokens(user, tokenId);
    const newHashedToken = await this.hashingProvider.hash(tokens.refreshToken);

    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: { token: newHashedToken },
    });

    return { ...tokens, user };
  }

  async logout(refreshToken: string) {
    const decodedToken: RefreshTokenPayload = this.jwt.decode(refreshToken);
    const tokenId = decodedToken.tokenId;
    if (tokenId)
      await prisma.refreshToken.delete({
        where: { id: tokenId },
      });
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async signTokens<T>(
    userId: string,
    expiresIn: number,
    secret: string,
    payload?: T,
  ) {
    return await this.jwt.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        secret,
        expiresIn,
        issuer: this.auth.issuer,
        audience: this.auth.audience,
      },
    );
  }

  async generateTokens(
    user: {
      id: string;
      username: string;
      email: string;
      userType: string;
      isVerified: boolean;
    },
    tokenId: string,
  ) {
    const accessToken = await this.signTokens(
      user.id,
      this.auth.expiresIn,
      this.auth.secret,
      {
        username: user.username,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        payloadType: 'ACCESS',
      },
    );

    const refreshToken = await this.signTokens(
      user.id,
      this.auth.refreshExpiresIn,
      this.auth.secret,
      {
        payloadType: 'REFRESH',
        tokenId: tokenId,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async generateVerificationToken(user: { id: string }) {
    return await this.signTokens(
      user.id,
      this.auth.verificationExpiresIn,
      this.auth.verificationSecret,
      {
        payloadType: 'VERIFICATION',
      },
    );
  }

  async sendMail(message: string, email: string) {
    await this.mailService.sendMail({
      from: 'Blueprint <blueprint@auth.com>',
      to: email,
      subject: 'OTP Verification',
      text: message,
    });
  }

  async sendOtp(user: LoginUser) {
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) throw new UnauthorizedException('User does not exist');

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).getTime();
    if (existingUser?.otpCreatedAt) {
      const createdAt = existingUser.otpCreatedAt.getTime();
      if (createdAt > oneMinuteAgo) {
        const remainingTime = createdAt - oneMinuteAgo;
        throw new BadRequestException(
          `Wait for ${Math.ceil(remainingTime / 1000)}s more before trying again!`,
        );
      }
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const hashedOtp = await this.hashingProvider.hash(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 10000);
    const now = new Date();

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { hashedOtp, otpExpiry, otpCreatedAt: now },
    });

    const message = `Your OTP is: ${otp}`;

    await this.sendMail(message, existingUser.email);
  }

  async getMe(userId: string) {
    const cacheKey = `user:${userId}`;

    const cachedUser = await this.redis.get(cacheKey);
    if (cachedUser) {
      const user = JSON.parse(cachedUser) as UserWProfile;
      return user;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUserData } = user;

    await this.redis.set(cacheKey, JSON.stringify(safeUserData), 'EX', 3600);

    return safeUserData;
  }
}
