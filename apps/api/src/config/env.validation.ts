import { z } from 'zod';
import validateOrThrow from 'src/common/helper/zod-validation.helper';

const envSchema = z.object({
  DATABASE_URL: z.url('Must provide database connection URL in .env'),
  JWT_AUTH_SECRET: z
    .string('JWT Authentication secret is required')
    .min(32, 'Auth Secret should be at least of 32 characters')
    .max(128, 'Auth Secret should be of max 128 characters'),
  JWT_EXPIRATION_TIME: z
    .string('JWT Auth Expiration time is required')
    .default('900'),
  JWT_REFRESH_EXPIRATION_TIME: z
    .string('JWT Refresh Token Expiration time is required')
    .default('604800'),
  JWT_ISSUER: z
    .url('JWT issuer url is required')
    .default('http://localhost:8000'),
  JWT_AUDIENCE: z
    .url('JWT audience url is required')
    .default('http://localhost:3000'),
  MAIL_HOST: z.string('Mail hostname is required'),
  MAIL_USERNAME: z.string('Mail username is required'),
  MAIL_PASSWORD: z.string('Mail Password is required'),
  REDIS_HOST: z.string('Redis host is required'),
  REDIS_PORT: z.string('Redis port is required'),
});

export default function envValidation(env: Record<string, string | undefined>) {
  const data = validateOrThrow(envSchema, env);
  return data;
}
