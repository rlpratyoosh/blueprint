import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { CACHE_KEY } from '../decorators/cache-ttl.decorator';
import { Request } from 'express';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ttl = this.reflector.get<number>(CACHE_KEY, context.getHandler());

    if (!ttl) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    if (method !== 'GET') {
      return next.handle();
    }

    const cacheKey = `cache:${url}`;

    const cachedResponse = await this.redis.get(cacheKey);
    if (cachedResponse) {
      return of(JSON.parse(cachedResponse));
    }

    return next.handle().pipe(
      tap((response) => {
        void this.redis.set(cacheKey, JSON.stringify(response), 'EX', ttl);
      }),
    );
  }
}
