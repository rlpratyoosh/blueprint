import { RegisterUserSchema } from '@repo/schema';
import { createZodDto } from 'nestjs-zod';

export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}
