import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

import { RabbitService } from '@app/shared';
import {
  DATABASE_TYPE,
  NotificationStatus,
  NotificationType,
  OK,
  PROVIDER_REPO,
  QUEUE_NAME,
  RMQ_CHANNEL,
} from '@common/consts';
import { IResponse, IResult } from '@common/interfaces';
import { NotificationRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { ConversationService } from '@modules/conversation/conversation.service';
import { User } from '@modules/users/entities';

import {
  CreateNotificationDto,
  DeleteManyNotification,
  FilterGetAllNotification,
  UpdateNotificationByUserDto,
  UpdateNotificationDto,
} from './dto';
import { Notification } from './entities';

@Injectable()
export class NotificationService implements OnModuleInit {
  private channel: ConfirmChannel;
  constructor(
    @Inject(PROVIDER_REPO.NOTIFICATION + DATABASE_TYPE.MONGO)
    private notificationRepo: NotificationRepo,
    private rabbitService: RabbitService,
    private conversationService: ConversationService,
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

  async findAll(user: User, filter: FilterGetAllNotification): Promise<IResult<Notification>> {
    try {
      if (typeof filter?.types === 'string') {
        filter.types = [filter.types];
      }
      const scheduleTypes = [
        NotificationType.ACCEPT_SCHEDULE_DATING,
        NotificationType.CANCEL_SCHEDULE_DATING,
        NotificationType.INVITE_SCHEDULE_DATING,
        NotificationType.DECLINE_SCHEDULE_DATING,
        NotificationType.POSITIVE_REVIEW_DATING,
      ];
      if (filter?.types?.includes(NotificationType.SCHEDULE_DATING)) {
        filter?.types?.push(...scheduleTypes);
      }
      const selectUserFields: Array<keyof User> = ['_id', 'images', 'name', 'onlineNow'];
      const [queryFilter, sortOption] = new FilterBuilder<Notification>()
        .setFilterItem('type', '$in', filter.types)
        .setFilterItem('receiver', '$eq', user._id)
        .setFilterItem('isDeleted', '$eq', false, true)
        .setSortItem('createdAt', 'desc')
        .buildQuery();
      const countFilter = JSON.parse(JSON.stringify(queryFilter));
      countFilter['$and'].push({ status: NotificationStatus.NOT_SEEN });
      const [results, totalNewNotification, totalCount] = await Promise.all([
        this.notificationRepo.findAll({
          queryFilter,
          populate: [{ path: 'schedule' }, { path: 'sender', select: selectUserFields.join(' ') }],
          sortOption,
        }),
        this.notificationRepo.count(countFilter),
        this.notificationRepo.count(queryFilter),
      ]);
      const response = formatResult(results, totalCount, { size: filter?.size, page: filter?.page });
      response.metadata = {
        totalNewNotification,
      };
      return response;
    } catch (error) {
      throw error;
    }
  }

  async countNoti(user: User, filter: FilterGetAllNotification): Promise<IResponse> {
    if (typeof filter?.types === 'string') {
      filter.types = [filter.types];
    }
    const scheduleTypes = [
      NotificationType.ACCEPT_SCHEDULE_DATING,
      NotificationType.CANCEL_SCHEDULE_DATING,
      NotificationType.INVITE_SCHEDULE_DATING,
      NotificationType.DECLINE_SCHEDULE_DATING,
      NotificationType.POSITIVE_REVIEW_DATING,
    ];
    if (filter?.types?.includes(NotificationType.SCHEDULE_DATING)) {
      filter?.types?.push(...scheduleTypes);
    }
    const [queryFilter] = new FilterBuilder<Notification>()
      .setFilterItem('receiver', '$eq', user._id)
      .setFilterItem('type', '$in', filter?.types)
      .setFilterItem('status', '$eq', filter?.status)
      .buildQuery();
    const [totalMessage, totalNoti] = await Promise.all([
      this.conversationService.countByMessageStatus(user),
      this.notificationRepo.count(queryFilter),
    ]);
    return {
      success: true,
      data: {
        totalCount: totalMessage + totalNoti,
      },
    };
  }

  async countSchedule(user: User): Promise<IResponse> {
    const [queryFilter] = new FilterBuilder<Notification>()
      .setFilterItem('type', '$in', [
        NotificationType.INVITE_SCHEDULE_DATING,
        NotificationType.ACCEPT_SCHEDULE_DATING,
        NotificationType.CANCEL_SCHEDULE_DATING,
        NotificationType.DECLINE_SCHEDULE_DATING,
      ])
      .setFilterItem('receiver', '$eq', user._id)
      .setFilterItem('isDeleted', '$eq', false, true)
      .setFilterItem('status', '$eq', NotificationStatus.NOT_RECEIVED)
      .setSortItem('createdAt', 'desc')
      .buildQuery();
    const totalCount = await this.notificationRepo.count(queryFilter);
    return {
      success: true,
      data: {
        totalCount,
      },
    };
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

  async deleteMany(data: DeleteManyNotification, user: User): Promise<void> {
    try {
      console.log('@@@@@@@@@@@@@@@@=Delete notification=@@@@@@@@@@@@@@@@');
      data.receiver = user._id;
      await this.notificationRepo.deleteByFilter(data);
    } catch (error) {
      throw error;
    }
  }

  async updateMany(notiDto: UpdateNotificationByUserDto, user: User): Promise<IResponse> {
    try {
      const { ids, notification } = notiDto;
      await this.notificationRepo.updateManyByIds(ids, notification, user);
      return {
        success: true,
        message: 'Ok',
      };
    } catch (error) {
      throw error;
    }
  }

  async updateManyBySchedule(user: User, update: UpdateNotificationDto): Promise<IResponse> {
    try {
      await this.notificationRepo.updateManyByFilter(
        { receiver: user._id, status: NotificationStatus.NOT_RECEIVED },
        update,
      );
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }
}
