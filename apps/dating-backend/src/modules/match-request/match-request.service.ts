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
import { IResponse, IResult } from '@common/interfaces';
import { MatchRequestRepo } from '@dating/repositories';
import { FilterBuilder, docToObject, formatResult } from '@dating/utils';

import { ConversationService } from '@modules/conversation/conversation.service';
import { NotificationService } from '@modules/notification/notification.service';
import { SocketGateway } from '@modules/socket/socket.gateway';

import { Conversation } from '@modules/conversation/entities';
import { User } from '@modules/users/entities';

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
      const unBlurIdx = user.featureAccess.findIndex(ft => ft.name === MerchandisingType.UN_BLUR && ft.unlimited);
      const selectFieldsPopulate: Array<keyof User> = ['_id', 'name', 'tags', 'bio', 'blurAvatar'];
      if (unBlurIdx != -1) {
        selectFieldsPopulate.push('images');
      }
      const populate: PopulateOptions[] = [];
      if (isPopulate) {
        populate.push({
          path: 'sender',
          select: selectFieldsPopulate.join(' '),
        });
      }
      const queryBuilder = new FilterBuilder<MatchRequest>()
        .setFilterItem('receiver', '$eq', user._id.toString())
        .setFilterItem('status', '$eq', MatchRqStatus.REQUESTED);
      const [nonBoostsFilter, sortNonBoostsRq] = docToObject(queryBuilder.buildQuery());
      const [boostsFilter, sortBoostRq] = queryBuilder
        .setFilterItem('isBoosts', '$eq', true)
        .setFilterItem('expiredAt', '$gte', new Date())
        .setSortItem('expiredAt', 'asc')
        .buildQuery();
      const [totalBoostsRq, totalCount] = await Promise.all([
        this.matchRequestRepo.findAll({
          queryFilter: boostsFilter,
          pagination: { size: filter?.size, page: filter?.page },
          sortOption: sortBoostRq,
        }),
        this.matchRequestRepo.count(nonBoostsFilter),
      ]);
      if (totalBoostsRq.length >= filter?.size || totalBoostsRq.length >= totalCount) {
        return formatResult(totalBoostsRq, totalCount, { size: filter?.size, page: filter?.page });
      }
      const totalNonBoostsRq = await this.matchRequestRepo.findAll({
        queryFilter: nonBoostsFilter,
        populate,
        pagination: { size: filter?.size - totalBoostsRq.length, page: filter?.page },
        sortOption: sortNonBoostsRq,
      });

      return formatResult(totalBoostsRq.concat(totalNonBoostsRq), totalCount, {
        size: filter?.size,
        page: filter?.page,
      });
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneMq): Promise<MatchRequest> {
    try {
      const queryBuilder = new FilterBuilder<MatchRequest>().setFilterItem('status', '$eq', filter?.status);
      if (filter?.receiver && filter?.sender) {
        queryBuilder.setFilterItemWithObject('$or', [
          { receiver: filter?.sender, sender: filter?.receiver },
          { receiver: filter?.receiver, sender: filter?.sender },
        ]);
      } else {
        queryBuilder.setFilterItem('receiver', '$eq', filter?.receiver);
      }
      const [queryFilter] = queryBuilder.buildQuery();
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
      members: [sender._id, receiver._id],
    };
    const notificationDto: CreateNotificationDto = {
      sender,
      receiver,
      type: NotificationType.MATCHED,
    };
    if (action == MerchandisingType.SUPER_LIKE) {
      conversationDto.type = ConversationType.SUPER_LIKE;
      notificationDto.type = NotificationType.SUPER_LIKE;
      matchRq.status = MatchRqStatus.SUPER_LIKE;
      conversationDto.createdBy = sender._id;
    }

    const conversation = await this.getConversationByStatus(matchedAction, conversationDto);
    matchRq.status = MatchRqStatus.MATCHED;

    const [notification] = await Promise.all([
      this.notiService.create(notificationDto),
      this.matchRequestRepo.save(matchRq),
    ]);

    const newConversation = await this.conversationService.toJSON(conversation);
    newConversation.members = [sender, receiver];
    const socketIds = socketIdsClient.receiver.concat(socketIdsClient.sender);

    if (conversation.type === ConversationType.MATCHED) {
      this.socketGateway.sendEventToClient(socketIds, 'newMatched', {
        conversation: newConversation,
        notificationId: notification._id,
      });
    }
  }

  async getConversationByStatus(
    matchedAction: IMatchedAction,
    conversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    let conversation: Conversation = null;
    const { sender, receiver, matchRq } = matchedAction;

    if (matchRq.status !== MatchRqStatus.SUPER_LIKE) {
      conversation = await this.conversationService.create(conversationDto);
    } else {
      conversation = await this.conversationService.findOneByMembers([sender._id, receiver._id]);
      if (!conversation) {
        conversation = await this.conversationService.create(conversationDto);
      } else {
        conversation.type = ConversationType.MATCHED;
        await this.conversationService.save(conversation);
      }
    }
    return conversation;
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
