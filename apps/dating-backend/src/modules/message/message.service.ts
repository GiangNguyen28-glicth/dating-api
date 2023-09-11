import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

import {
  DATABASE_TYPE,
  PROVIDER_REPO,
  QUEUE_NAME,
  RMQ_CHANNEL,
} from '@common/consts';
import { IResponse, IResult } from '@common/interfaces';
import { MessageRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { ConversationService } from '@modules/conversation/conversation.service';
import { Image, User } from '@modules/users/entities';

import { Message } from './entities';
import {
  CreateMessageDto,
  FilterGetAllMessageDTO,
  SeenMessage,
  UpdateMessageDto,
} from './dto';
import { RabbitService } from '@app/shared';

@Injectable()
export class MessageService implements OnModuleInit {
  private channel: ConfirmChannel;

  constructor(
    @Inject(PROVIDER_REPO.MESSAGE + DATABASE_TYPE.MONGO)
    private messageRepo: MessageRepo,
    private conversationService: ConversationService,
    private rabbitService: RabbitService,
  ) {}

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.channel = await this.rabbitService.createChannel(
      RMQ_CHANNEL.MESSAGE_CHANNEL,
    );
    await this.rabbitService.assertQueue(
      {
        queue: QUEUE_NAME.MESSAGE_IMAGES_BUILDER,
        options: {
          durable: true,
          arguments: {
            'x-queue-type': 'quorum',
          },
        },
      },
      RMQ_CHANNEL.MESSAGE_CHANNEL,
    );
  }

  async create(messageDto: CreateMessageDto, user: User): Promise<Message> {
    delete messageDto['status'];
    try {
      messageDto['sender'] = user._id.toString();

      const message = await this.messageRepo.insert(messageDto);
      const conversation = await this.conversationService.findOneAndUpdate(
        messageDto.conversation,
        { lastMessage: message },
      );
      throwIfNotExists(conversation, 'Không tìm thấy cuộc hội thoại');
      await this.messageRepo.save(message);
      if (messageDto.images && messageDto.images.length) {
        await this.rabbitService.sendToQueue(
          QUEUE_NAME.MESSAGE_IMAGES_BUILDER,
          {
            messageId: message._id,
            images: messageDto.images,
          },
        );
      }
      return this.messageRepo.toJSON(message);
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGetAllMessageDTO): Promise<IResult<Message>> {
    try {
      const [queryFilter, sortOption] = new FilterBuilder<Message>()
        .setFilterItem('conversation', '$eq', filter?.conversation)
        .setSortItem('createdAt', 'desc')
        .buildQuery();
      // eslint-disable-next-line prefer-const
      let [results, totalCount] = await Promise.all([
        this.messageRepo.findAll({
          queryFilter,
          sortOption,
          pagination: { size: filter?.size, page: filter?.page },
        }),
        this.messageRepo.count(queryFilter),
      ]);
      results = results.reverse();
      return formatResult(results, totalCount, {
        page: filter?.page,
        size: filter?.size,
      });
    } catch (error) {
      throw error;
    }
  }

  async findOneAndUpdate(
    id: string,
    messageDto: UpdateMessageDto,
  ): Promise<Message> {
    const message = await this.messageRepo.findOneAndUpdate(id, messageDto);
    throwIfNotExists(message, 'Message không tồn tại');
    return message;
  }

  async seenMessage(seenMessage: SeenMessage): Promise<void> {
    try {
      await this.messageRepo.seenMessage(seenMessage);
    } catch (error) {
      throw error;
    }
  }

  async receivedMessage(receiverId: string): Promise<void> {
    try {
      await this.messageRepo.receivedMessage(receiverId);
    } catch (error) {
      throw error;
    }
  }

  async remove(_id: string): Promise<IResponse> {
    try {
      const message = await this.messageRepo.findOneAndUpdate(_id, {
        isDeleted: true,
      });
      if (!message) {
        throwIfNotExists(message, 'Message không tông tại');
      }
      return {
        success: true,
        message: 'Xóa tin nhắn thành công',
      };
    } catch (error) {
      throw error;
    }
  }
}
