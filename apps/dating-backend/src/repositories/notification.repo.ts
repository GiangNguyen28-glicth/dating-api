import { InjectModel } from '@nestjs/mongoose';
import {
  CrudRepo,
  DATABASE_TYPE,
  NotificationModelType,
  PROVIDER_REPO,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Notification } from '@modules/notification';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NotificationRepo extends CrudRepo<Notification> {}
export class NotificationMongoRepo extends MongoRepo<Notification> {
  constructor(
    @InjectModel(Notification.name)
    protected notificationModel: NotificationModelType,
  ) {
    super(notificationModel);
  }
}

export const NotificationMongoRepoProvider = {
  provide: PROVIDER_REPO.NOTIFICATION + DATABASE_TYPE.MONGO,
  useClass: NotificationMongoRepo,
};
