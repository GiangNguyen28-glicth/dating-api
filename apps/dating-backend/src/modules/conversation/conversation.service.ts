import { Inject, Injectable, forwardRef } from '@nestjs/common';

import { DATABASE_TYPE, EXCLUDE_FIELDS, MessageStatus, MongoQuery, PROVIDER_REPO } from '@common/consts';
import { PaginationDTO } from '@common/dto';
import { IOptionFilterGetOne, IResult } from '@common/interfaces';
import { ConversationRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { User } from '@modules/users/entities';
import { MessageService } from '@modules/message/message.service';

import { Conversation } from './entities';
import { CreateConversationDto, FilterGetAllConversationDTO, FilterGetOneConversationDTO } from './dto';

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
    return await this.conversationRepo.save(conversation);
  }

  async findAll(user: User, filter: FilterGetAllConversationDTO): Promise<IResult<Conversation>> {
    try {
      const query: MongoQuery = filter?.message != 0 ? '$ne' : '$eq';

      const [queryFilter, sortOption] = new FilterBuilder<Conversation>()
        .setFilterItem('members', '$elemMatch', { $eq: user._id })
        .setFilterItem('lastMessage', query, null, true)
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
      this.setReceiver(results, user._id.toString());
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

  setReceiver(conversations: Conversation[], userId: string) {
    conversations.map(item => {
      item['user'] = this.getReceiver(item, userId) as User;
      return item;
    });
  }

  getReceiver(conversation: Conversation, userId: string, isPopulate?: boolean): User | string {
    if (!isPopulate) {
      return (conversation.members[0] as User)._id.toString() === userId
        ? (conversation.members[1] as User)
        : (conversation.members[0] as User);
    }
    return conversation.members[0] === userId ? conversation.members[1] : conversation.members[0];
  }

  async findOne(filter: FilterGetOneConversationDTO, user: User): Promise<Conversation> {
    try {
      const [queryFilter] = new FilterBuilder<Conversation>()
        .setFilterItem('_id', '$eq', filter?._id)
        .setFilterItem('members', '$elemMatch', { $eq: user._id })
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
      newConversation.user = this.getReceiver(conversation, user._id.toString()) as User;

      return newConversation;
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
    const reverseMembers = members.reverse();
    const query: any = {
      $or: [{ members: members }, { members: reverseMembers }],
    };
    return await this.conversationRepo.findOne(query);
  }

  async toJSON(conversation: Conversation): Promise<Conversation> {
    return await this.conversationRepo.toJSON(conversation);
  }
}
