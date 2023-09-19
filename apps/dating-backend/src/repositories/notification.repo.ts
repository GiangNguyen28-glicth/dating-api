import { InjectModel } from '@nestjs/mongoose';
import { CrudRepo, DATABASE_TYPE, NotificationModelType, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Notification } from '@modules/notification/entities';
import { User } from '@modules/users/entities';

export interface NotificationRepo extends CrudRepo<Notification> {
  updateManyByReceiver(ids: string[], entities: Partial<Notification>, user: User): Promise<void>;
  deleteManyByReceiver(ids: string[], user: User): Promise<void>;
}
export class NotificationMongoRepo extends MongoRepo<Notification> {
  constructor(
    @InjectModel(Notification.name)
    protected notificationModel: NotificationModelType,
  ) {
    super(notificationModel);
  }

  async updateManyByReceiver(ids: string[], entities: Partial<Notification>, user: User): Promise<void> {
    await this.notificationModel.updateMany({ _id: { $in: ids }, receiver: user._id }, entities);
  }

  async deleteManyByReceiver(ids: string[], user: User): Promise<void> {
    await this.notificationModel.deleteMany({ _id: { $in: ids }, receiver: user._id });
  }
}

export const NotificationMongoRepoProvider = {
  provide: PROVIDER_REPO.NOTIFICATION + DATABASE_TYPE.MONGO,
  useClass: NotificationMongoRepo,
};
