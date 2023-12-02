import { Inject, Injectable, forwardRef } from '@nestjs/common';

import {
  ConversationType,
  DATABASE_TYPE,
  EXCLUDE_FIELDS,
  MessageStatus,
  MongoQuery,
  OK,
  PROVIDER_REPO,
} from '@common/consts';
import { PaginationDTO } from '@common/dto';
import { IOptionFilterGetOne, IResponse, IResult } from '@common/interfaces';
import { ConversationRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';

import { MessageService } from '@modules/message/message.service';
import { User } from '@modules/users/entities';
import { FilterGetStatistic, GroupDate } from '@modules/admin/dto';

import { CreateConversationDto, FilterGetAllConversationDTO, FilterGetOneConversationDTO } from './dto';
import { Conversation } from './entities';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(PROVIDER_REPO.CONVERSATION + DATABASE_TYPE.MONGO)
    private conversationRepo: ConversationRepo,

    @Inject(forwardRef(() => MessageService))
    private messageService: MessageService,
  ) {}
  async create(conversationDto: CreateConversationDto): Promise<Conversation> {
    const conversation = await this.conversationRepo.insert(conversationDto);
    conversation.enableSafeMode = conversationDto.members;
    return await this.conversationRepo.save(conversation);
  }

  async findAll(user: User, filter: FilterGetAllConversationDTO): Promise<IResult<Conversation>> {
    try {
      const query: MongoQuery = filter?.message != 0 ? '$ne' : '$eq';

      const [queryFilter, sortOption] = new FilterBuilder<Conversation>()
        .setFilterItem('members', '$elemMatch', { $eq: user._id })
        .setFilterItem('lastMessage', query, null, true)
        .setFilterItem('createdBy', '$ne', user._id)
        .setFilterItem('isDeleted', '$eq', false, true)
        .setSortItem('updatedAt', -1)
        .buildQuery();
      const pagination: PaginationDTO = {
        size: filter?.size,
        page: filter?.page,
      };
      const [totalCount, results] = await Promise.all([
        this.conversationRepo.count(queryFilter),
        this.conversationRepo.findAll({
          queryFilter,
          sortOption,
          pagination,
          populate: [
            {
              path: 'members',
              select: EXCLUDE_FIELDS.USER,
            },
            {
              path: 'lastMessage',
            },
            {
              path: 'messagePin',
            },
          ],
        }),
      ]);
      Conversation.setReceiver(results, user._id.toString());
      const newResults = await this.processUpdatedMessage(results, user._id.toString());
      return formatResult(newResults, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  async processUpdatedMessage(conversation: Conversation[], receiverId: string): Promise<Conversation[]> {
    const conversationIds: string[] = [];
    const conversationUpdated = conversation.map(item => {
      if (item.lastMessage && item.lastMessage.status == MessageStatus.SENT) {
        conversationIds.push(item._id);
        item.lastMessage.status = MessageStatus.RECEIVED;
      }
      return item;
    });
    if (conversationIds.length) {
      await this.messageService.receivedMessage(receiverId);
    }
    return conversationUpdated;
  }

  async countByMessageStatus(user: User): Promise<number> {
    return await this.conversationRepo.countByMessageStatus(user._id.toString());
  }

  async findOne(filter: FilterGetOneConversationDTO, user: User): Promise<Conversation> {
    try {
      const [queryFilter] = new FilterBuilder<Conversation>()
        .setFilterItem('_id', '$eq', filter?._id)
        .setFilterItem('members', '$elemMatch', { $eq: user._id })
        .setFilterItem('isDeleted', '$eq', false, true)
        .setFilterItem('createdBy', '$ne', user._id.toString())
        .buildQuery();
      const options: IOptionFilterGetOne<Conversation> = {
        queryFilter,
        populate: [],
      };
      if (filter?.populate) {
        options.populate.push({
          path: 'members',
          select: EXCLUDE_FIELDS.USER,
          populate: {
            path: 'tags',
          },
        });
      }
      const conversation = await this.conversationRepo.findOne(options);
      throwIfNotExists(conversation, 'Không tìm thấy Conversation');
      if (!filter?.toJSON) {
        return conversation;
      }
      const newConversation = this.conversationRepo.toJSON(conversation);
      newConversation.user = Conversation.getReceiver(conversation, user._id.toString()) as User;

      return newConversation;
    } catch (error) {
      throw error;
    }
  }

  async findMembersIdById(conversationId: string): Promise<string[]> {
    try {
      const conversation = await this.conversationRepo.findOne({
        queryFilter: { _id: conversationId },
      });
      throwIfNotExists(conversation, 'Không tìm thấy cuộc hội thoại');

      return conversation.members.map(item => item.toString());
    } catch (error) {
      throw error;
    }
  }

  async findOneAndUpdate(_id: string, entities?: Partial<Conversation>): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepo.findOneAndUpdate(_id, entities);
      return conversation;
    } catch (error) {
      throw error;
    }
  }

  async findOneByMembers(members: string[]): Promise<Conversation> {
    const queryFilter: any = {
      $or: [{ members: members }, { members: [members[1], members[0]] }],
    };
    return await this.conversationRepo.findOne({ queryFilter });
  }

  async toJSON(conversation: Conversation): Promise<Conversation> {
    return await this.conversationRepo.toJSON(conversation);
  }

  async save(conversation: Conversation): Promise<Conversation> {
    try {
      return await this.conversationRepo.save(conversation);
    } catch (error) {
      throw error;
    }
  }

  async enableSafeMode(user: User, conversationId: string): Promise<IResponse> {
    try {
      const conversation = await this.conversationRepo.enableSafeMode(user._id, conversationId);
      throwIfNotExists(conversation, 'Not found');
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async disableSafeMode(user: User, conversationId: string): Promise<IResponse> {
    try {
      const conversation = await this.conversationRepo.disableSafeMode(user._id, conversationId);
      throwIfNotExists(conversation, 'Not found');
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  //======================================Admin======================================
  async statisticByRangeDate(filter: FilterGetStatistic): Promise<any> {
    const queryBuilder = new FilterBuilder<Conversation>().setFilterItem('type', '$eq', ConversationType.MATCHED);
    if (filter?.fromDate && filter?.toDate) {
      queryBuilder.setFilterItemWithObject('createdAt', { $gte: filter?.fromDate, $lte: filter?.toDate });
    }
    const [queryFilter] = queryBuilder.buildQuery();
    const matched = await this.conversationRepo.statisticByRangeDate(queryFilter, filter.format);
    return {
      matched,
    };
  }
}
