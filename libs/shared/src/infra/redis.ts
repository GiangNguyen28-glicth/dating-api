import {
  CacheModuleOptions,
  CacheOptionsFactory,
  Injectable,
} from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      store: redisStore as any,
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      username: process.env.REDIS_USERNAME,
      password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
      max: parseInt(process.env.REDIS_MAX_SIZE),
      isGlobal: true,
    };
  }
}
