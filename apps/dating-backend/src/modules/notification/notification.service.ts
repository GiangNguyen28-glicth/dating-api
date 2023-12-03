import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

import { RabbitService } from '@app/shared';
import { DATABASE_TYPE, NotificationStatus, OK, PROVIDER_REPO, QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { IResponse, IResult } from '@common/interfaces';
import { NotificationRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { ConversationService } from '@modules/conversation/conversation.service';
import { User } from '@modules/users/entities';

import {
  CreateNotificationDto,
  FilterGetAllNotification,
  UpdateNotificationByUserDto,
  UpdateNotificationDto,
} from './dto';
import { Notification } from './entities';
import { set } from 'lodash';

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
      set(filter, 'types', Notification.getFilter(filter?.types));
      const selectUserFields: Array<keyof User> = ['_id', 'images', 'name', 'onlineNow'];
      const [queryFilter, sortOption] = new FilterBuilder<Notification>()
        .setFilterItem('receiver', '$eq', user._id)
        .setFilterItem('status', '$eq', filter?.status)
        .setFilterItem('type', '$in', filter?.types)
        .setSortItem('createdAt', 'desc')
        .buildQuery();
      const countFilter = JSON.parse(JSON.stringify(queryFilter));
      countFilter['$and'].push({ status: NotificationStatus.NOT_SEEN });
      const [results, totalNewNotification, totalCount] = await Promise.all([
        this.notificationRepo.findAll({
          queryFilter,
          populate: [{ path: 'sender', select: selectUserFields.join(' ') }],
          sortOption,
          pagination: {
            page: filter?.page,
            size: filter?.size,
          },
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
    set(filter, 'types', Notification.getFilter(filter?.types));
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
        totalNewNotification: totalNoti,
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

  async deleteMany(filter: FilterGetAllNotification): Promise<void> {
    try {
      set(filter, 'types', Notification.getFilter(filter?.types));
      console.log('@@@@@@@@@@@@@@@@=Delete notification=@@@@@@@@@@@@@@@@');
      const [queryFilter] = new FilterBuilder<Notification>()
        .setFilterItem('_id', '$in', filter?.ids)
        .setFilterItem('receiver', '$eq', filter?.receiver)
        .setFilterItem('schedule', '$eq', filter?.schedule)
        .setFilterItem('status', '$eq', filter?.status)
        .setFilterItem('type', '$in', filter?.types)
        .buildQuery();
      await this.notificationRepo.deleteByFilter(queryFilter);
    } catch (error) {
      throw error;
    }
  }

  async updateStatusToReceived(filter: FilterGetAllNotification, notiDto: UpdateNotificationDto): Promise<IResponse> {
    try {
      set(filter, 'types', Notification.getFilter(filter?.types));
      const [queryFilter] = new FilterBuilder<Notification>()
        .setFilterItem('receiver', '$eq', filter?.receiver)
        .setFilterItem('type', '$in', filter?.types)
        .setFilterItem('status', '$eq', filter?.status)
        .buildQuery();
      await this.notificationRepo.updateManyByFilter(queryFilter, notiDto);
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOneAndUpdate(id: string, body: UpdateNotificationDto, user: User): Promise<IResponse> {
    try {
      await this.notificationRepo.updateManyByFilter({ _id: id, receiver: user._id }, body);
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async save(noti: Notification): Promise<void> {
    try {
      await this.notificationRepo.save(noti);
    } catch (error) {
      throw error;
    }
  }
}
