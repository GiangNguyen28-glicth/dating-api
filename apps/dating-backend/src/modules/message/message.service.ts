import { Inject, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { DATABASE_TYPE, PROVIDER_REPO } from '@common/consts';
import { MessageRepo } from '@dating/repositories';
import { FilterGetAllMessageDTO } from './dto/filter-message.dto';
import { IResult } from '@common/interfaces';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { User } from '@modules/users/entities/user.entity';
import { ConversationService } from '@modules/conversation/conversation.service';
import { Message } from './entities/message.entity';
import { PaginationDTO } from '@common/dto';

@Injectable()
export class MessageService {
  constructor(
    @Inject(PROVIDER_REPO.MESSAGE + DATABASE_TYPE.MONGO)
    private messageRepo: MessageRepo,
    private conversationService: ConversationService,
  ) {}
  async create(messageDto: CreateMessageDto, user: User): Promise<Message> {
    try {
      messageDto['sender'] = user._id.toString();
      const [conversation, message] = await Promise.all([
        this.conversationService.findOne({ _id: messageDto.conversion }, user), //1
        this.messageRepo.insert(messageDto),
      ]);
      let isFirstMessage = false;
      if (!conversation.lastMessage) {
        isFirstMessage = true;
        message['cursor'] = 1;
      } else {
        message.cursor = (conversation.lastMessage as Message).cursor + 1;
      }
      conversation.lastMessage = message;
      await Promise.all([
        this.conversationService.updateModel(conversation), //7
        this.messageRepo.save(message), //8
      ]);
      return message;
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGetAllMessageDTO): Promise<IResult<Message>> {
    try {
      const cursor = (filter.page - 1) * filter.size;
      const [queryFilter] = new FilterBuilder<Message>()
        .setFilterItem('conversion', '$eq', filter?.conversion)
        .setFilterItem('cursor', '$gte', cursor)
        .setSortItem('createdAt', 'desc')
        .buildQuery();
      const [results, totalCount] = await Promise.all([
        this.messageRepo.findAll({ queryFilter }),
        this.messageRepo.count(queryFilter),
      ]);
      return formatResult(results, totalCount, {
        page: filter?.page,
        size: filter?.size,
      });
    } catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  async remove(_id: string): Promise<boolean> {
    try {
      const message = await this.messageRepo.findOneAndUpdate(_id, {
        isDeleted: true,
      });
      throwIfNotExists(message, 'Message not found');
      return message ? true : false;
    } catch (error) {
      throw error;
    }
  }
}
