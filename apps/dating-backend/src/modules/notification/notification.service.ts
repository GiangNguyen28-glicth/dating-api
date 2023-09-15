import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

import {
  DATABASE_TYPE,
  NotificationStatus,
  NotificationType,
  PROVIDER_REPO,
  QUEUE_NAME,
  RMQ_CHANNEL,
} from '@common/consts';
import { IResponse } from '@common/interfaces';
import { NotificationRepo } from '@dating/repositories';
import { FilterBuilder, throwIfNotExists } from '@dating/utils';
import { User } from '@modules/users/entities';
import { RabbitService } from '@app/shared';

import { CreateNotificationDto, FilterGetAllNotification } from './dto';
import { Notification } from './entities';
import { INotificationResult } from './interfaces';

@Injectable()
export class NotificationService implements OnModuleInit {
  private channel: ConfirmChannel;
  constructor(
    @Inject(PROVIDER_REPO.NOTIFICATION + DATABASE_TYPE.MONGO)
    private notificationRepo: NotificationRepo,
    private rabbitService: RabbitService,
  ) {}

  async onModuleInit() {
    // return;
    await this.rabbitService.connectRmq();
    this.channel = await this.rabbitService.createChannel(RMQ_CHANNEL.NOTIFICATION_CHANNEL);
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
  }

  async create(notificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = await this.notificationRepo.insert(notificationDto);
      return await this.notificationRepo.save(notification);
    } catch (error) {
      throw error;
    }
  }

  async findAll(user: User, filter: FilterGetAllNotification): Promise<INotificationResult> {
    try {
      const [queryFilter, sortOption] = new FilterBuilder<Notification>()
        .setFilterItem('receiver', '$eq', user._id)
        .setFilterItem('status', '$eq', filter?.status)
        .setSortItem('createdAt', 'desc')
        .buildQuery();
      const notifications = await this.notificationRepo.findAll({
        queryFilter,
        sortOption,
        pagination: { size: filter?.size, page: filter?.page },
      });
      if (filter?.status === NotificationStatus.NOT_RECEIVED) {
        await this.rabbitService.sendToQueue(
          QUEUE_NAME.NOTIFICATION_UPDATER,
          notifications,
          RMQ_CHANNEL.NOTIFICATION_CHANNEL,
        );
      }
      const notificationResults: INotificationResult = {
        messages: [],
        matched: [],
        likes: [],
      };
      notifications.forEach(notification => {
        switch (notification.type) {
          case NotificationType.MESSAGE:
            notificationResults.messages.push(notification);
          case NotificationType.LIKE:
            notificationResults.likes.push(notification);
          case NotificationType.MATCHED:
            notificationResults.matched.push(notification);
        }
      });

      return notificationResults;
    } catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  async remove(id: string): Promise<IResponse> {
    try {
      const notification = await this.notificationRepo.delete(id);
      throwIfNotExists(notification, 'Không tìm thấy notification');
      return {
        success: true,
        message: 'Xóa notification thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async updateMany(ids: string[]): Promise<void> {
    try {
      await this.notificationRepo.updateMany(ids, {
        status: NotificationStatus.RECEIVED,
      });
    } catch (error) {
      throw error;
    }
  }
}
