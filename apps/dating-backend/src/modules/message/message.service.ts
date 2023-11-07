import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

import {
  ConversationType,
  DATABASE_TYPE,
  MerchandisingType,
  MessageType,
  PROVIDER_REPO,
  QUEUE_NAME,
  RMQ_CHANNEL,
} from '@common/consts';
import { IResponse, IResult } from '@common/interfaces';
import { MessageRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { ConversationService } from '@modules/conversation/conversation.service';
import { User } from '@modules/users/entities';
import { RabbitService } from '@app/shared';

import { Message } from './entities';
import { CreateMessageDto, FilterGetAllMessageDTO, ReviewCallDTO, SeenMessage, UpdateMessageDto } from './dto';

@Injectable()
export class MessageService implements OnModuleInit {
  private channel: ConfirmChannel;

  constructor(
    @Inject(PROVIDER_REPO.MESSAGE + DATABASE_TYPE.MONGO)
    private messageRepo: MessageRepo,

    @Inject(forwardRef(() => ConversationService))
    private conversationService: ConversationService,

    private rabbitService: RabbitService,
  ) {}

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.channel = await this.rabbitService.createChannel(RMQ_CHANNEL.MESSAGE_CHANNEL);
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
      const conversation = await this.conversationService.findOneAndUpdate(messageDto.conversation, {
        lastMessage: message,
        type: ConversationType.MATCHED,
      });
      throwIfNotExists(conversation, 'Không tìm thấy cuộc hội thoại');
      await this.messageRepo.save(message);
      if (messageDto.images && messageDto.images.length) {
        await this.rabbitService.sendToQueue(QUEUE_NAME.MESSAGE_IMAGES_BUILDER, {
          messageId: message._id,
          images: messageDto.images,
        });
      }
      return this.messageRepo.toJSON(message);
    } catch (error) {
      throw error;
    }
  }

  findMembersIdById(conversationId: string) {
    try {
      return this.conversationService.findMembersIdById(conversationId);
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

  async count(filter: FilterGetAllMessageDTO): Promise<number> {
    const [queryFilter] = new FilterBuilder<Message>()
      .setFilterItem('conversation', '$eq', filter?.conversation)
      .setFilterItem('status', '$eq', filter?.status)
      .setFilterItem('receiver', '$eq', filter?.receiver)
      .setSortItem('createdAt', 'desc')
      .buildQuery();
    return await this.messageRepo.count(queryFilter);
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

  async updateMessageToReceived(ids: string[]): Promise<void> {
    try {
      await this.messageRepo.updateMessageToReceived(ids);
    } catch (error) {
      throw error;
    }
  }

  async findOneAndUpdate(id: string, messageDto: UpdateMessageDto): Promise<Message> {
    const message = await this.messageRepo.findOneAndUpdate(id, messageDto);
    throwIfNotExists(message, 'Message không tồn tại');
    return message;
  }

  async remove(_id: string): Promise<IResponse> {
    try {
      const message = await this.messageRepo.findOneAndUpdate(_id, {
        isDeleted: true,
        text: 'Tin nhan da bi xoa',
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

  async reviewCallMessage(review: ReviewCallDTO, user: User): Promise<IResponse> {
    try {
      const message = await this.messageRepo.findOne({
        queryFilter: { _id: review.messageId, type: MessageType.CALL },
      });
      throwIfNotExists(message, 'Message không tồn tại');
      await this.conversationService.findOne({ _id: message.conversation.toString() }, user);
      message.rating = review.rating;
      if (review.content) {
        message.reviewMessage = review.content;
      }
      await this.messageRepo.save(message);
      return {
        success: true,
        message: 'Ok',
      };
    } catch (error) {
      throw error;
    }
  }
}
