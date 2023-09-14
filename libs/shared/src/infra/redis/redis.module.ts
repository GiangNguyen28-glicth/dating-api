import { CacheModule, Global, Module } from '@nestjs/common';
import { RedisClientOptions } from 'redis';
import { RedisService } from './redis.service';
import { CacheConfigService } from './redis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useClass: CacheConfigService,
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
