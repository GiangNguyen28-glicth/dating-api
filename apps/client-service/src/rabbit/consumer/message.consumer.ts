import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

import { RabbitService } from '@app/shared';
import { QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { IMessageImageBuilder } from '@common/message';
import { MessageService } from '@modules/message';
import { ImageService } from '../../images/image.service';

@Injectable()
export class MessageConsumer implements OnModuleInit, OnModuleDestroy {
  private channel: ConfirmChannel;

  constructor(
    private messageService: MessageService,
    private rabbitService: RabbitService,
    private imageService: ImageService,
  ) {}

  onModuleDestroy() {
    return;
    throw new Error('Method not implemented.');
  }

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
    await Promise.all([this.consumeImageBuilder()]);
    await this.rabbitService.startConsuming(RMQ_CHANNEL.MESSAGE_CHANNEL);
  }

  async consumeImageBuilder(): Promise<void> {
    const hook = async () => {
      this.channel.consume(
        QUEUE_NAME.MESSAGE_IMAGES_BUILDER,
        async msg => {
          try {
            const content: IMessageImageBuilder = this.rabbitService.getContentFromMessage(msg);
            await this.updateImages(content);
            await this.channel.ack(msg);
          } catch (error) {
            console.log(error);
            await this.rabbitService.reject(msg, true, RMQ_CHANNEL.MESSAGE_CHANNEL);
          }
        },
        { noAck: false },
      );
    };
    this.rabbitService.pushToHooks(RMQ_CHANNEL.MESSAGE_CHANNEL, hook);
  }

  async updateImages(msg: IMessageImageBuilder) {
    try {
      const { messageId, images } = msg;
      await Promise.all(
        msg.images.map(async image => {
          if (!image.blur) {
            image.blur = await this.imageService.encodeImageToBlurhash(image.url);
          }
        }),
      );
      await this.messageService.findOneAndUpdate(messageId, { images });
    } catch (error) {
      throw error;
    }
  }
}
