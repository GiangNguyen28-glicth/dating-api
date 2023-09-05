import { Global, Module } from '@nestjs/common';
import { UsersModule } from '@modules/users';
import { BillingModule } from '@modules/billing';
import { MessageConsumer, PaymentConsumer, UserConsumer } from './consumer';
import { MessageModule } from '@modules/message';

@Global()
@Module({
  imports: [UsersModule, BillingModule, MessageModule],
  providers: [PaymentConsumer, UserConsumer, MessageConsumer],
  exports: [],
})
export class RabbitConsumerModule {}
