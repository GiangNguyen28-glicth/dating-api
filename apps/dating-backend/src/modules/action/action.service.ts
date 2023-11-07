import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { get } from 'lodash';
import * as moment from 'moment-timezone';
import { DurationInputArg2 } from 'moment-timezone';

import { DATABASE_TYPE, MatchRqStatus, MerchandisingType, PROVIDER_REPO } from '@common/consts';
import { IErrorResponse, IResponse } from '@common/interfaces';
import { ActionRepo } from '@dating/repositories';
import { FilterBuilder, throwIfNotExists } from '@dating/utils';

import { MatchRequestService } from '@modules/match-request/match-request.service';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { SocketService } from '@modules/socket/socket.service';
import { UserService } from '@modules/users/users.service';
import { OfferingService } from '@modules/offering/offering.service';

import { User } from '@modules/users/entities';

import { CreateMatchRequestDto } from '@modules/match-request/dto';
import { IMatchedAction } from '@modules/match-request/interfaces';
import { FilterGetOneActionDTO } from './dto';
import { Action } from './entities';

@Injectable()
export class ActionService {
  constructor(
    @Inject(PROVIDER_REPO.ACTION + DATABASE_TYPE.MONGO)
    private actionRepo: ActionRepo,

    @Inject(forwardRef(() => SocketGateway))
    private socketGateway: SocketGateway,

    @Inject(forwardRef(() => SocketService))
    private socketService: SocketService,

    @Inject(forwardRef(() => UserService))
    private userService: UserService,

    private matchReqService: MatchRequestService,
    private offeringService: OfferingService,
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

  async action(sender: User, receiverId: string, action: MerchandisingType): Promise<IResponse> {
    try {
      const idx = sender.featureAccess.findIndex(item => item.name === action);
      if (!Action.isByPassAction(sender.featureAccess[idx])) {
        const offering = await this.offeringService.findOne({
          type: sender.featureAccess[idx].name as any,
          isRetail: true,
        });
        const objError: IErrorResponse = {
          message: `Đã sử dụng hết lượt ${action.toLowerCase()} ngày hôm nay`,
        };
        if (offering) {
          objError.data = {
            offering,
          };
        }
        throw new BadRequestException(objError);
      }

      const [receiver, matchRq] = await Promise.all([
        this.userService.findOne({ _id: receiverId }),
        this.matchReqService.findOne({
          sender: receiverId,
          receiver: sender._id.toString(),
        }),
      ]);
      if (Action.isDuplicateAction(matchRq, sender)) {
        return {
          success: false,
          message: 'Duplicate match request',
        };
      }

      const socketIdsClient = await this.socketService.getSocketIdsMatchedUser(sender._id.toString(), receiverId);
      const matchedAction: IMatchedAction = { sender, receiver, socketIdsClient, action };
      if (matchRq) {
        matchedAction.matchRq = matchRq;
        await this.matchReqService.matched(matchedAction);
      } else {
        const matchRqDto: CreateMatchRequestDto = {
          sender: sender._id,
          receiver: receiverId,
        };
        if (action == MerchandisingType.LIKE) {
          this.socketGateway.sendEventToClient(socketIdsClient.receiver, 'newMatchRequest', sender);
          matchRqDto.status = MatchRqStatus.REQUESTED;
          await this.like(sender, matchRqDto);
          await this.matchReqService.create(matchRqDto);
        } else {
          this.socketGateway.sendEventToClient(socketIdsClient.receiver, 'newSuperLike', sender);
          matchRqDto.status = MatchRqStatus.SUPER_LIKE;
          const superMatchRq = await this.matchReqService.create(matchRqDto);
          matchedAction.matchRq = superMatchRq;
          await this.superLike(matchedAction);
        }
      }

      await this.actionRepo.like(sender, receiverId);
      const resp: IResponse = {
        success: true,
        message: 'Ok',
      };

      if (!sender.featureAccess[idx].unlimited) {
        sender.featureAccess[idx].amount = sender.featureAccess[idx].amount - 1;
        await this.userService.findOneAndUpdate(sender._id, {
          featureAccess: sender.featureAccess,
        });
        resp['data'] = {
          featureAccess: {
            likes: {
              amount: sender.featureAccess[idx].amount,
            },
          },
        };
      }

      return resp;
    } catch (error) {
      throw error;
    }
  }

  async like(sender: User, matchRqDto: CreateMatchRequestDto): Promise<void> {
    if (get(sender, 'boostsSession.expiredDate', null) > new Date()) {
      matchRqDto.isBoosts = true;
      const { refreshInterval, refreshIntervalUnit } = sender.boostsSession;
      matchRqDto.expiredAt = moment()
        .add(refreshInterval, refreshIntervalUnit.toLowerCase() as DurationInputArg2)
        .toDate();
    }
  }

  async superLike(matchedAction: IMatchedAction): Promise<void> {
    try {
      await this.matchReqService.matched(matchedAction);
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
      await Promise.all([this.actionRepo.skip(owner, userId), this.matchReqService.skip(owner._id.toString(), userId)]);

      return {
        success: true,
        message: 'Skip thành công',
      };
    } catch (error) {
      throw error;
    }
  }
}
