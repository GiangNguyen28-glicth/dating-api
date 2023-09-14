import { Inject, Injectable, forwardRef } from '@nestjs/common';

import { DATABASE_TYPE, PROVIDER_REPO } from '@common/consts';
import { IResponse } from '@common/interfaces';
import { ActionRepo } from '@dating/repositories';
import { MatchRequestService } from '@modules/match-request/match-request.service';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { User } from '@modules/users/entities';
import { UserService } from '@modules/users/users.service';
import { FilterBuilder, throwIfNotExists } from '@dating/utils';

import { FilterGetOneActionDTO } from './dto';
import { Action } from './entities';

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

  async like(sender: User, receiverId: string): Promise<IResponse> {
    try {
      const receiver = await this.userService.findOne({ _id: receiverId });
      throwIfNotExists(receiver, 'Receiver không tồn tại');
      const matchRq = await this.matchReqService.findOne({
        sender: sender._id,
        receiver: receiverId,
      });
      const socketIdsClient = await this.socketGateway.getSocketIdsMatchedUser(sender._id.toString(), receiverId);
      if (matchRq) {
        await this.matchReqService.matched(sender, receiver, socketIdsClient, matchRq._id);
      } else {
        this.socketGateway.sendEventToClient(socketIdsClient.receiver, 'matchRequest', receiver);
        await this.matchReqService.create({
          sender: sender._id,
          receiver: receiverId,
        });
      }
      await this.actionRepo.like(sender, receiverId);
      const resp: IResponse = {
        success: true,
        message: 'Like thành công',
      };
      if (!sender.featureAccess.likes.unlimited) {
        await this.userService.findOneAndUpdate(sender._id, {
          featureAccess: {
            likes: {
              unlimited: false,
              amount: sender.featureAccess.likes.amount - 1,
            },
            rewind: sender.featureAccess.rewind,
          },
        });
        resp['data'] = {
          featureAccess: {
            likes: {
              amount: sender.featureAccess.likes.amount - 1,
            },
          },
        };
      }
      return resp;
    } catch (error) {
      throw error;
    }
  }

  async getAllIgnoreIdsUser(userId: string, key: string): Promise<string[]> {
    try {
      const [queryFilter] = new FilterBuilder<Action>().setFilterItem('userId', '$eq', userId).buildQuery();
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
      const [queryFilter] = new FilterBuilder<Action>().setFilterItem('userId', '$eq', userId).buildQuery();
      const userIds: string[] = await this.actionRepo.distinct('likedUser', queryFilter);
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
