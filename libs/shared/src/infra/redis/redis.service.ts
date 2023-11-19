import { CACHE_MANAGER, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { Cache } from 'cache-manager';

import { IRedisSet } from './redis.interfaces';

@Injectable()
export class RedisService implements OnModuleInit {
  private redisClient: Redis;
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.redisClient = (this.cacheManager as any).store.getClient() as Redis;
  }

  onModuleInit() {
    this.redisClient.on('error', err => {
      console.error(`Redis error: ${err}`);
    });

    this.redisClient.on('close', () => {
      console.log('Redis connection closed');
    });
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

  async deleteWithPrefixKey(key: string): Promise<void> {
    let cursor = '0';

    const data: any = new Promise((resolve, reject) => {
      this.redisClient.scan(cursor, 'MATCH', `${key}*`, 'COUNT', '1000', (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve(reply);
      });
    });
    do {
      const [newCursor, keys] = await data;
      if (keys.length > 0) {
        // Delete the keys in batches
        await this.redisClient.del(...keys);
      }
      cursor = newCursor;
    } while (cursor !== '0');
  }
}
