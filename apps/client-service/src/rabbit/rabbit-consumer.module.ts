import { Global, Module } from '@nestjs/common';

import { UsersModule } from '@modules/users';
import { BillingModule } from '@dating/modules';
import { MessageModule } from '@modules/message';
import { NotificationModule } from '@modules/notification';

import {
  MessageConsumer,
  PaymentConsumer,
  UserConsumer,
  NotificationConsumer,
} from './consumer';

@Global()
@Module({
  imports: [UsersModule, BillingModule, MessageModule, NotificationModule],
  providers: [
    PaymentConsumer,
    UserConsumer,
    MessageConsumer,
    NotificationConsumer,
  ],
  exports: [],
})
export class RabbitConsumerModule {}
