import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NotificationMongoRepoProvider } from '@dating/repositories';
import { ConversationModule } from '@modules/conversation';

import { Notification, NotificationSchema } from './entities';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]), ConversationModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationMongoRepoProvider],
  exports: [NotificationService],
})
export class NotificationModule {}
