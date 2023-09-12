import { Inject, Injectable } from '@nestjs/common';

import {
  DATABASE_TYPE,
  NotificationStatus,
  NotificationType,
  PROVIDER_REPO,
} from '@common/consts';
import { IResponse } from '@common/interfaces';
import { NotificationRepo } from '@dating/repositories';
import { FilterBuilder, throwIfNotExists } from '@dating/utils';
import { User } from '@modules/users';

import { CreateNotificationDto, FilterGetAllNotification } from './dto';
import { Notification } from './entities';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(PROVIDER_REPO.NOTIFICATION + DATABASE_TYPE.MONGO)
    private notificationRepo: NotificationRepo,
  ) {}

  async create(notificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = await this.notificationRepo.insert(notificationDto);
      return await this.notificationRepo.save(notification);
    } catch (error) {
      throw error;
    }
  }

  async findAll(user: User, filter: FilterGetAllNotification): Promise<any> {
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
      const groupNotification = new Map();
      notifications.forEach(notification => {
        switch (notification.type) {
          case NotificationType.MESSAGE:
        }
      });
      if (filter?.status === NotificationStatus.NOT_SEEN) {
      }
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
}
