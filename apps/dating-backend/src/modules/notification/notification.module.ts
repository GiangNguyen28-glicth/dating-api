import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NotificationMongoRepoProvider } from '@dating/repositories';

import { Notification, NotificationSchema } from './entities';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }])],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationMongoRepoProvider],
})
export class NotificationModule {}
