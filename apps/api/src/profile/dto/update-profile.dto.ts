import { UpdateProfileSchema } from '@repo/schema';
import { createZodDto } from 'nestjs-zod';

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
