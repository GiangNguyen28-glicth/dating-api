import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';
import Redis from 'ioredis';

import { RabbitService } from '@app/shared';
import { NotificationType, QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { INotificationUpdater } from '@common/message';
import { NotificationService } from '@modules/notification/notification.service';
import { MessageService } from '@modules/message/message.service';

@Injectable()
export class NotificationConsumer implements OnModuleInit, OnModuleDestroy {
  private channel: ConfirmChannel;
  private redisClient: Redis;

  constructor(
    private rabbitService: RabbitService,
    private notificationService: NotificationService,
    private messageService: MessageService,
  ) {}

  onModuleDestroy() {
    return;
    throw new Error('Method not implemented.');
  }

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.channel = await this.rabbitService.createChannel(
      RMQ_CHANNEL.NOTIFICATION_CHANNEL,
    );
    await this.rabbitService.assertQueue(
      {
        queue: QUEUE_NAME.NOTIFICATION_UPDATER,
        options: {
          durable: true,
          arguments: {
            'x-queue-type': 'quorum',
          },
        },
      },
      RMQ_CHANNEL.NOTIFICATION_CHANNEL,
    );
    await Promise.all([this.consumeNotification()]);
    await this.rabbitService.startConsuming(RMQ_CHANNEL.NOTIFICATION_CHANNEL);
  }

  async consumeNotification(): Promise<void> {
    const hook = async () => {
      this.channel.consume(
        QUEUE_NAME.UPDATE_FEATURE_ACCESS,
        async msg => {
          try {
            const content: INotificationUpdater =
              this.rabbitService.getContentFromMessage(msg);
            await this.updateNotification(content);
            await this.channel.ack(msg);
          } catch (error) {
            await this.rabbitService.reject(
              msg,
              true,
              RMQ_CHANNEL.NOTIFICATION_CHANNEL,
            );
          }
        },
        { noAck: false },
      );
    };
    this.rabbitService.pushToHooks(RMQ_CHANNEL.NOTIFICATION_CHANNEL, hook);
  }

  async updateNotification(msg: INotificationUpdater): Promise<void> {
    const notificationIds: string[] = [];
    const messageIds: string[] = [];
    msg.notifications.map(notification => {
      notificationIds.push(notification._id);
      if (notification.type === NotificationType.MESSAGE) {
        messageIds.push(notification.message._id);
      }
    });
    try {
      await Promise.all([
        this.notificationService.updateMany(notificationIds),
        this.messageService.updateMessageToReceived(messageIds),
      ]);
    } catch (error) {
      throw error;
    }
  }
}
