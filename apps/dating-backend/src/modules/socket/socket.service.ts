import { SOCKET } from '@common/consts';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Cache } from 'cache-manager';

@Injectable()
export class SocketService {
  private redisClient: Redis;
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.redisClient = (this.cacheManager as any).store.getClient() as Redis;
  }

  async getSocketIdsByUser(userId: string): Promise<string[]> {
    const REDIS_KEY = SOCKET + userId;
    return new Promise(resolve => {
      this.redisClient.smembers(REDIS_KEY, async (err, socketIds: string[] = []) => {
        resolve(socketIds);
      });
    });
  }

  getRedisClient() {
    return this.redisClient;
  }
}
