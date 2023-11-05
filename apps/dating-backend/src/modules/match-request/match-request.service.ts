import { Inject, Injectable } from '@nestjs/common';
import { PopulateOptions } from 'mongoose';

import {
  ConversationType,
  DATABASE_TYPE,
  MatchRqStatus,
  MerchandisingType,
  NotificationType,
  PROVIDER_REPO,
} from '@common/consts';
import { PaginationDTO } from '@common/dto';
import { IResponse, IResult } from '@common/interfaces';
import { MatchRequestRepo } from '@dating/repositories';
import { FilterBuilder, formatResult } from '@dating/utils';

import { ConversationService } from '@modules/conversation/conversation.service';
import { NotificationService } from '@modules/notification/notification.service';
import { SocketGateway } from '@modules/socket/socket.gateway';
import { User } from '@modules/users/entities';

import { ACTION } from '@modules/action/dto';
import { CreateConversationDto } from '@modules/conversation/dto';
import { CreateNotificationDto } from '@modules/notification/dto';
import { CreateMatchRequestDto, FilterGelAllMqDTO, FilterGetOneMq } from './dto';
import { MatchRequest } from './entities';
import { IMatchedAction } from './interfaces';

@Injectable()
export class MatchRequestService {
  constructor(
    @Inject(PROVIDER_REPO.MATCH_REQUEST + DATABASE_TYPE.MONGO)
    private matchRequestRepo: MatchRequestRepo,

    private conversationService: ConversationService,
    private socketGateway: SocketGateway,
    private notiService: NotificationService,
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
      const basicFieldsPopulate: Array<keyof User> = ['_id', 'name', 'images', 'tags', 'bio', 'blurAvatar'];
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
        .setFilterItem('status', '$eq', filter?.status)
        .setFilterItemWithObject('$or', [
          { receiver: filter?.sender, sender: filter?.receiver },
          { receiver: filter?.receiver, sender: filter?.sender },
        ])
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

  async matched(matchedAction: IMatchedAction): Promise<void> {
    const { sender, receiver, socketIdsClient, matchRq, action } = matchedAction;
    const conversationDto: CreateConversationDto = {
      members: [sender, receiver],
    };
    const notificationDto: CreateNotificationDto = {
      sender,
      receiver,
      type: NotificationType.MATCHED,
    };
    matchRq.status = MatchRqStatus.MATCHED;
    if (action == MerchandisingType.SUPER_LIKE) {
      conversationDto.type = ConversationType.SUPER_LIKE;
      conversationDto.createdBy = sender._id;
      notificationDto.type = NotificationType.SUPER_LIKE;
      matchRq.status = MatchRqStatus.SUPER_LIKE;
    }
    const conversation = await this.conversationService.create(conversationDto);
    notificationDto.conversation = conversation;

    const [notification] = await Promise.all([
      this.notiService.create(notificationDto),
      this.matchRequestRepo.save(matchRq),
    ]);

    const newConversation = await this.conversationService.toJSON(conversation);
    newConversation.members = [sender, receiver];
    const socketIds = socketIdsClient.receiver.concat(socketIdsClient.sender);

    if (action == ACTION.LIKE) {
      this.socketGateway.sendEventToClient(socketIds, 'newMatched', {
        conversation: newConversation,
        notificationId: notification._id,
      });
    }
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
}
