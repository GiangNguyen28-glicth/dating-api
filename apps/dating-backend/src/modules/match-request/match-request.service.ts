import { Inject, Injectable } from '@nestjs/common';
import { PopulateOptions } from 'mongoose';

import { RedisService } from '@app/shared';
import { DATABASE_TYPE, MatchRqStatus, NotificationType, PROVIDER_REPO } from '@common/consts';
import { PaginationDTO } from '@common/dto';
import { IResponse, IResult, ISocketIdsClient } from '@common/interfaces';
import { MatchRequestRepo } from '@dating/repositories';
import { FilterBuilder, formatResult } from '@dating/utils';
import { ConversationService } from '@modules/conversation/conversation.service';
import { NotificationService } from '@modules/notification/notification.service';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { User } from '@modules/users/entities';

import { CreateMatchRequestDto, FilterGelAllMqDTO, FilterGetOneMq } from './dto';
import { MatchRequest } from './entities';

@Injectable()
export class MatchRequestService {
  constructor(
    @Inject(PROVIDER_REPO.MATCH_REQUEST + DATABASE_TYPE.MONGO)
    private matchRequestRepo: MatchRequestRepo,

    private conversationService: ConversationService,
    private socketGateway: SocketGateway,
    private notfiService: NotificationService,
    private redisService: RedisService,
  ) {}
  async create(matchRequestDto: CreateMatchRequestDto): Promise<MatchRequest> {
    try {
      const matchRequest = await this.matchRequestRepo.insert(matchRequestDto);
      await this.matchRequestRepo.save(matchRequest);
      return matchRequest;
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGelAllMqDTO, user: User, isPopulate = false): Promise<IResult<MatchRequest>> {
    try {
      const pagination: PaginationDTO = {
        size: filter?.size,
        page: filter?.page,
      };
      const basicFieldsPopulate = ['_id', 'name', 'images', 'tags', 'bio', 'blurAvatar'];
      const populate: PopulateOptions[] = [];
      if (isPopulate) {
        populate.push({
          path: 'sender',
          select: basicFieldsPopulate.join(' '),
        });
      }
      const [queryFilter] = new FilterBuilder<MatchRequest>()
        .setFilterItem('receiver', '$eq', user._id.toString())
        .setFilterItem('status', '$eq', MatchRqStatus.REQUESTED)
        .buildQuery();
      const [results, totalCount] = await Promise.all([
        this.matchRequestRepo.findAll({ queryFilter, populate, pagination }),
        this.matchRequestRepo.count(queryFilter),
      ]);
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneMq): Promise<MatchRequest> {
    try {
      const [queryFilter] = new FilterBuilder<MatchRequest>()
        .setFilterItem('receiver', '$eq', filter?.receiver)
        .setFilterItem('sender', '$eq', filter?.sender)
        .setFilterItem('status', '$eq', filter?.status)
        .setSortItem('createdAt', 'descending')
        .buildQuery();
      const populate: PopulateOptions[] = [];
      if (filter?.populate) {
        populate.push({
          path: 'sender',
          select: '_id name images',
        });
      }
      return await this.matchRequestRepo.findOne({ queryFilter, populate });
    } catch (error) {
      throw error;
    }
  }

  async skip(receiverId: string, senderId: string): Promise<void> {
    try {
      await this.matchRequestRepo.skip(receiverId, senderId);
    } catch (error) {
      throw error;
    }
  }

  async matched(sender: User, receiver: User, socketIdsClient: ISocketIdsClient, matchRq: MatchRequest): Promise<void> {
    const conversation = await this.conversationService.create({
      members: [sender, receiver],
    });
    matchRq.status = MatchRqStatus.MATCHED;
    const [notification] = await Promise.all([
      this.notfiService.create({
        sender,
        receiver,
        type: NotificationType.MATCHED,
        conversation,
      }),
      this.matchRequestRepo.save(matchRq),
    ]);

    const newConversation = await this.conversationService.toJSON(conversation);
    newConversation.members = [sender, receiver];
    const socketIds = socketIdsClient.receiver.concat(socketIdsClient.sender);
    this.socketGateway.sendEventToClient(socketIds, 'newMatched', {
      conversation: newConversation,
      notificationId: notification._id,
    });
  }

  async countMatchRequest(user: User): Promise<IResponse> {
    const [totalCount, representUser] = await Promise.all([
      this.matchRequestRepo.count({ receiver: user._id, status: MatchRqStatus.REQUESTED }),
      this.findOne({ receiver: user._id, status: MatchRqStatus.REQUESTED, populate: true }),
    ]);
    let blur = null;
    if (totalCount > 0) {
      blur = (representUser.sender as User).images.find(image => image.blur).blur;
    }
    return {
      success: true,
      data: {
        totalCount,
        isBlur: true,
        blur,
      },
    };
  }

  async testRedis(): Promise<void> {
    this.redisService.setex({ key: 'abc', ttl: 10 * 60, data: '1' });
  }
}
