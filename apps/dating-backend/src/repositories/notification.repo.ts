import { InjectModel } from '@nestjs/mongoose';

import { CrudRepo, DATABASE_TYPE, NotificationModelType, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';

import { UpdateNotificationDto } from '@modules/notification/dto';
import { Notification } from '@modules/notification/entities';
import { User } from '@modules/users/entities';

export interface NotificationRepo extends CrudRepo<Notification> {
  updateManyByFilter(filter: Partial<Notification>, update: UpdateNotificationDto): Promise<Notification[]>;
  deleteManyByReceiver(ids: string[], user: User): Promise<void>;
  deleteByFilter(filter: Partial<Notification>): Promise<void>;
}
export class NotificationMongoRepo extends MongoRepo<Notification> {
  constructor(
    @InjectModel(Notification.name)
    protected notificationModel: NotificationModelType,
  ) {
    super(notificationModel);
  }

  async updateManyByFilter(filter: Partial<Notification>, update: UpdateNotificationDto): Promise<void> {
    await this.notificationModel.updateMany(filter, update);
  }

  async deleteByFilter(filter: Partial<Notification>): Promise<void> {
    await this.notificationModel.deleteMany(filter);
  }
}

export const NotificationMongoRepoProvider = {
  provide: PROVIDER_REPO.NOTIFICATION + DATABASE_TYPE.MONGO,
  useClass: NotificationMongoRepo,
};
