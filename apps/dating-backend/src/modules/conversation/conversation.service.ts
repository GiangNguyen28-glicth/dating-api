import { Inject, Injectable } from '@nestjs/common';

import {
  DATABASE_TYPE,
  EXCLUDE_FIELDS,
  MongoQuery,
  PROVIDER_REPO,
} from '@common/consts';
import { PaginationDTO } from '@common/dto';
import { IOptionFilterGetOne, IResult } from '@common/interfaces';
import { ConversationRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { User } from '@modules/users/entities';

import { Conversation } from './entities';
import {
  CreateConversationDto,
  FilterGetAllConversationDTO,
  FilterGetOneConversationDTO,
} from './dto';

@Injectable()
export class ConversationService {
  constructor(
    @Inject(PROVIDER_REPO.CONVERSATION + DATABASE_TYPE.MONGO)
    private conversationRepo: ConversationRepo,
  ) {}
  async create(conversationDto: CreateConversationDto): Promise<Conversation> {
    const conversation = await this.conversationRepo.insert(conversationDto);
    return await this.conversationRepo.save(conversation);
  }

  async findAll(
    user: User,
    filter: FilterGetAllConversationDTO,
  ): Promise<IResult<Conversation>> {
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
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  setReceiver(conversations: Conversation[], userId: string) {
    conversations.map(item => {
      item['user'] = this.getReceiver(item, userId) as User;
      return item;
    });
  }

  getReceiver(
    conversation: Conversation,
    userId: string,
    isPopulate?: boolean,
  ): User | string {
    if (!isPopulate) {
      return (conversation.members[0] as User)._id.toString() === userId
        ? (conversation.members[1] as User)
        : (conversation.members[0] as User);
    }
    return conversation.members[0] === userId
      ? conversation.members[1]
      : conversation.members[0];
  }

  async findOne(
    filter: FilterGetOneConversationDTO,
    user: User,
  ): Promise<Conversation> {
    try {
      const [queryFilter] = new FilterBuilder<Conversation>()
        .setFilterItem('_id', '$eq', filter?._id)
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
      throwIfNotExists(conversation, 'Conversation not found');
      if (!filter?.toJSON) {
        return conversation;
      }
      const newConversation = this.conversationRepo.toJSON(conversation);
      newConversation.user = this.getReceiver(
        conversation,
        user._id.toString(),
      ) as User;

      return newConversation;
    } catch (error) {
      throw error;
    }
  }

  async findOneAndUpdate(
    _id: string,
    entities?: Partial<Conversation>,
  ): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepo.findOneAndUpdate(
        _id,
        entities,
      );
      return conversation;
    } catch (error) {
      throw error;
    }
  }

  getQueryOrMembers(members: string[]) {
    const reverseMembers = members.reverse();
    const query = {
      $or: [{ members: members }, { members: reverseMembers }],
    };
    return query;
  }

  async updateModel(conversation: Conversation): Promise<Conversation> {
    return await this.conversationRepo.updateEntities(conversation);
  }
}
