import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { IRedisSet } from './redis.interfaces';

@Injectable()
export class RedisService {
  private redisClient: Redis;
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.redisClient = (this.cacheManager as any).store.getClient() as Redis;
  }

  getRedisClient() {
    return this.redisClient;
  }

  async smembers(key: string): Promise<any[]> {
    return new Promise(resolve => {
      this.redisClient.smembers(key, async (err, value: [] = []) => {
        resolve(value);
      });
    });
  }

  async set(redisSet: IRedisSet): Promise<string> {
    const { ttl, key, data } = redisSet;
    return new Promise((resolve, reject) => {
      this.redisClient.set(key, ttl, data, err => {
        if (err) {
          reject(err);
        }
        resolve('OK');
      });
    });
  }
}
