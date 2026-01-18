import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_ttl';
export const CacheTTL = (seconds: number) => SetMetadata(CACHE_KEY, seconds);
