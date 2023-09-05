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
      url: `redis://default:PZHZWKsUEr3S4CdicyjKlEmWEOMhErVZ@redis-19981.c54.ap-northeast-1-2.ec2.cloud.redislabs.com:19981`,
      username: process.env.REDIS_USERNAME,
      password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
      max: parseInt(process.env.REDIS_MAX_SIZE),
      isGlobal: true,
    };
  }
}
