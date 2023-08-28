import {
  DATABASE_TYPE,
  EXCLUDE_FIELDS,
  MongoQuery,
  PROVIDER_REPO,
} from '@common/consts';
import { PaginationDTO } from '@common/dto';
import { IResult } from '@common/interfaces';
import { ConversationRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { Inject, Injectable } from '@nestjs/common';
import {
  FilterGetAllConversationDTO,
  FilterGetOneConversationDTO,
} from './dto/conversation.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from './entities/conversation.entity';

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
              path: 'lastMessage',
            },
            {
              path: 'members',
              select: EXCLUDE_FIELDS.USER,
            },
          ],
        }),
      ]);
      this.filterByLastMessaged(results, user._id.toString());
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  filterByLastMessaged(conversations: Conversation[], user_id: string) {
    conversations.map(item => {
      item.user =
        (item.members[0] as User)._id.toString() === user_id
          ? (item.members[1] as User)
          : (item.members[0] as User);
      return item;
    });
  }

  async findOne(
    filter: FilterGetOneConversationDTO,
    user: User,
  ): Promise<Conversation> {
    try {
      const [queryFilter] = new FilterBuilder<Conversation>()
        .setFilterItem('_id', '$eq', filter?._id)
        .buildQuery();
      const conversation = await this.conversationRepo.findOne({ queryFilter });
      throwIfNotExists(conversation, 'Conversation not found');
      conversation.user =
        conversation.members[0]._id.toString() === user._id.toString()
          ? conversation.members[1]
          : conversation.members[0];
      return conversation;
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
