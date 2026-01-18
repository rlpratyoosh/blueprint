import { BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

export default function validateOrThrow<T>(
  schema: ZodType<T>,
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new BadRequestException(result.error.issues[0].message);
  return result.data;
}
