import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

import { RabbitService } from '@app/shared';
import { QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { UserService } from '@modules/users';
import { IUserImageBuilder } from '@common/message';

import { encodeImageToBlurhash } from '../../images';

@Injectable()
export class UserConsumer implements OnModuleInit, OnModuleDestroy {
  private channel: ConfirmChannel;

  constructor(private rabbitService: RabbitService, private userService: UserService) {}

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.rabbitService.setChannelName(RMQ_CHANNEL.USER_CHANNEL);
    this.channel = await this.rabbitService.createChannel(RMQ_CHANNEL.USER_CHANNEL);
    this.channel.prefetch(4);

    await this.rabbitService.assertQueue(
      {
        queue: QUEUE_NAME.USER_IMAGES_BUILDER,
        options: {
          durable: true,
          arguments: {
            'x-queue-type': 'quorum',
          },
        },
      },
      RMQ_CHANNEL.USER_CHANNEL,
    );
    await Promise.all([this.consumeImageBuilder()]);
    await this.rabbitService.startConsuming(RMQ_CHANNEL.USER_CHANNEL);
  }

  async consumeImageBuilder(): Promise<void> {
    const hook = async (): Promise<void> => {
      this.channel.consume(
        QUEUE_NAME.USER_IMAGES_BUILDER,
        async msg => {
          try {
            const content: IUserImageBuilder = this.rabbitService.getContentFromMessage(msg);
            await this.processEncodeImage(content);
            await this.channel.ack(msg);
          } catch (error) {
            await this.rabbitService.reject(msg);
          }
        },
        { noAck: false },
      );
    };
    this.rabbitService.pushToHooks(RMQ_CHANNEL.USER_CHANNEL, hook);
  }

  onModuleDestroy() {
    return;
    throw new Error('Method not implemented.');
  }

  async processEncodeImage(msg: IUserImageBuilder): Promise<void> {
    try {
      await Promise.all(
        msg.images.map(async image => {
          if (!image.blur) {
            image.blur = await encodeImageToBlurhash(image.url);
          }
        }),
      );
      await this.userService.findOneAndUpdate(msg.userId, {
        images: msg.images,
      });
    } catch (error) {}
  }
}
