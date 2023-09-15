import { RedisService } from '@app/shared';
import { SOCKET } from '@common/consts';
import { ISocketIdsClient } from '@common/interfaces';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketService {
  constructor(private redisService: RedisService) {}

  async getSocketIdsByUser(userId: string): Promise<string[]> {
    return await this.redisService.smembers(SOCKET + userId);
  }

  async getSocketIdsMatchedUser(userId1: string, userId2: string): Promise<ISocketIdsClient> {
    const [sender, receiver] = await Promise.all([this.getSocketIdsByUser(userId1), this.getSocketIdsByUser(userId2)]);
    return { sender, receiver };
  }
}
