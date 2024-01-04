import { Inject, Injectable, forwardRef } from '@nestjs/common';

import { RedisService } from '@app/shared';
import { SOCKET } from '@common/consts';
import { ISocketIdsClient } from '@common/interfaces';
import { MessageService } from '..';

export const rooms: Map<
  string,
  {
    callerId: string;

    offer: any;
    answer: any;
    startTime: Date;
    endTime: Date;
    socketsIds: Record<string, boolean>;
  }
> = new Map();
export const roomMapping: Map<string, string> = new Map();
export const userAvailable: Map<string, boolean> = new Map();

@Injectable()
export class SocketService {
  constructor(
    @Inject(forwardRef(() => MessageService))
    private messageService: MessageService,

    private redisService: RedisService,
  ) {}

  async getSocketIdsByUser(userId: string): Promise<string[]> {
    return await this.redisService.smembers(SOCKET + userId);
  }

  async getSocketIdsMatchedUser(userId1: string, userId2: string): Promise<ISocketIdsClient> {
    const [sender, receiver] = await Promise.all([this.getSocketIdsByUser(userId1), this.getSocketIdsByUser(userId2)]);
    return { sender, receiver };
  }

  async userAvailable(roomId: string) {
    try {
      const memberIds = await this.messageService.findMembersIdById(roomId);
      const isBusy = memberIds.some(id => userAvailable.has(id));
      if (isBusy) {
        return {
          success: false,
          message: 'Người dùng đang bận',
        };
      }
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
