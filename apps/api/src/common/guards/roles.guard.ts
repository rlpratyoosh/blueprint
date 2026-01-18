import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VerifiedUserRequest } from 'src/auth/auth.controller';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request: VerifiedUserRequest = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) return false;

    return requiredRoles.some((role) => user.userType === role);
  }
}
