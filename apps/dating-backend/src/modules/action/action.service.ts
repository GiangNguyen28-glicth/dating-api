import { Inject, Injectable, forwardRef } from '@nestjs/common';

import { DATABASE_TYPE, PROVIDER_REPO } from '@common/consts';
import { IResponse, ISocketIdsClient } from '@common/interfaces';
import { ActionRepo } from '@dating/repositories/action.repo';
import { FilterBuilder, throwIfNotExists } from '@dating/utils';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { User } from '@modules/users/entities';

import { FilterGetOneActionDTO } from './dto/action.dto';
import { Action } from './entites/action.entity';
import { MatchRequestService } from '@modules/match-request/match-request.service';
import { ConversationService } from '@modules/conversation/conversation.service';
import { UserService } from '@modules/users/users.service';

@Injectable()
export class ActionService {
  constructor(
    @Inject(PROVIDER_REPO.ACTION + DATABASE_TYPE.MONGO)
    private actionRepo: ActionRepo,
    @Inject(forwardRef(() => SocketGateway))
    private socketGateway: SocketGateway,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private matchReqService: MatchRequestService,
    private conversationService: ConversationService,
  ) {}

  async findOne(filter: FilterGetOneActionDTO): Promise<Action> {
    const [queryFilter] = new FilterBuilder<Action>()
      .setFilterItem('countLiked', '$lte', filter?.countLiked)
      .setFilterItem('countUnLiked', '$lte', filter?.countUnLiked)
      .setFilterItem('userId', '$eq', filter?.userId)
      .buildQuery();
    try {
      const action = await this.actionRepo.findOne(queryFilter);
      throwIfNotExists(action, 'Không thể tìm thấy Action');
      return action;
    } catch (error) {}
  }

  async like(owner: User, userId: string): Promise<IResponse> {
    try {
      const matchRq = await this.matchReqService.findOne({
        owner: owner._id.toString(),
        requestBy: userId,
      });
      const socketIdsClient = await this.socketGateway.getSocketIdsMatchedUser(
        owner._id.toString(),
        userId,
      );
      if (matchRq) {
        await this.matched(owner, userId, socketIdsClient, matchRq._id);
        // await this.actionRepo.
      } else {
        this.socketGateway.sendEventToClient(
          socketIdsClient.receiver,
          'matchRequest',
          owner,
        );
      }
      await this.actionRepo.like(owner, userId);
      await this.matchReqService.create({
        requestBy: owner._id,
        owner: userId,
      });
      const resp: IResponse = {
        success: true,
        message: 'Like thành công',
      };
      if (!owner.featureAccess.likes.unlimited) {
        await this.userService.findOneAndUpdate(owner._id, {
          featureAccess: {
            likes: {
              unlimited: false,
              amount: owner.featureAccess.likes.amount - 1,
            },
            rewind: owner.featureAccess.rewind,
          },
        });
        resp['data'] = {
          featureAccess: {
            likes: {
              amount: owner.featureAccess.likes.amount - 1,
            },
          },
        };
      }
      return resp;
    } catch (error) {
      throw error;
    }
  }

  async matched(
    owner: User,
    userId: string,
    socketIdsClient: ISocketIdsClient,
    matchRqId: string,
  ): Promise<void> {
    await this.conversationService.create({
      members: [owner._id.toString(), userId],
    });
    await this.matchReqService.remove(matchRqId);
    this.socketGateway.sendEventToClient(
      socketIdsClient.sender,
      'notificationOwner',
      'HelloWorld',
    );
    this.socketGateway.sendEventToClient(
      socketIdsClient.receiver,
      'notificationReceiver',
      'HelloWorld',
    );
  }

  async getAllIgnoreIdsUser(userId: string, key: string): Promise<string[]> {
    try {
      const [queryFilter] = new FilterBuilder<Action>()
        .setFilterItem('userId', '$eq', userId)
        .buildQuery();
      const userIds: string[] = await this.actionRepo.distinct(key, {
        queryFilter,
      });
      return userIds;
    } catch (error) {
      throw error;
    }
  }

  async getAllIdsLikedUser(userId: string): Promise<string[]> {
    try {
      const [queryFilter] = new FilterBuilder<Action>()
        .setFilterItem('userId', '$eq', userId)
        .buildQuery();
      const userIds: string[] = await this.actionRepo.distinct(
        'likedUser',
        queryFilter,
      );
      return userIds;
    } catch (error) {
      throw error;
    }
  }

  async skip(owner: User, userId: string): Promise<IResponse> {
    try {
      await this.actionRepo.skip(owner, userId);
      return {
        success: true,
        message: 'Skip thành công',
      };
    } catch (error) {
      throw error;
    }
  }
}
