import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SetPublic } from './common/decorators/public.decorator';
import { CacheTTL } from './common/decorators/cache-ttl.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SetPublic()
  @CacheTTL(60)
  getHello(): string {
    return this.appService.getHello();
  }
}
