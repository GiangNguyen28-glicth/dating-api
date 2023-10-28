import { InjectModel } from '@nestjs/mongoose';
import { CrudRepo, DATABASE_TYPE, NotificationModelType, NotificationStatus, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Notification } from '@modules/notification/entities';
import { User } from '@modules/users/entities';
import { UpdateNotificationDto } from '@modules/notification/dto';

export interface NotificationRepo extends CrudRepo<Notification> {
  updateManyByIds(ids: string[], entities: Partial<Notification>, user: User): Promise<void>;
  updateManyByFilter(filter: Partial<Notification>, update: UpdateNotificationDto): Promise<void>;
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

  async updateManyByIds(ids: string[], entities: Partial<Notification>, user: User): Promise<void> {
    await this.notificationModel.updateMany({ _id: { $in: ids }, receiver: user._id }, entities);
  }

  async updateManyByFilter(filter: Partial<Notification>, update: UpdateNotificationDto): Promise<void> {
    await this.notificationModel.updateMany(filter, update);
  }

  async deleteManyByIds(ids: string[], user: User): Promise<void> {
    await this.notificationModel.deleteMany({ _id: { $in: ids }, receiver: user._id });
  }

  async deleteByFilter(filter: Partial<Notification>): Promise<void> {
    await this.notificationModel.deleteMany(filter);
  }
}

export const NotificationMongoRepoProvider = {
  provide: PROVIDER_REPO.NOTIFICATION + DATABASE_TYPE.MONGO,
  useClass: NotificationMongoRepo,
};
