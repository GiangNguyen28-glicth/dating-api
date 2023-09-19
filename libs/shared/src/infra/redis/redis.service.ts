import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { IRedisSet } from './redis.interfaces';
import { Cache } from 'cache-manager';

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
      this.redisClient.smembers(key, async (err, value: string[]) => {
        resolve(value);
      });
    });
  }

  async setex(redisSet: IRedisSet): Promise<string> {
    const { ttl, key, data } = redisSet;
    return new Promise((resolve, reject) => {
      this.redisClient.set(key, data, 'EX', ttl, err => {
        if (err) {
          reject(err);
        }
        resolve('OK');
      });
    });
  }

  async get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.redisClient.get(key, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async srem(key: string, value): Promise<void> {
    await this.redisClient.srem(key, value);
  }

  async sadd(key: string, value): Promise<void> {
    await this.redisClient.sadd(key, value);
  }
}
