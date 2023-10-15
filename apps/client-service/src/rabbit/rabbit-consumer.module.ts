import { Global, Module } from '@nestjs/common';

import { BillingModule } from '@dating/modules';
import { MessageModule } from '@modules/message';

import { MessageConsumer, PaymentConsumer, SendMailConsumer, UserConsumer } from './consumer';

@Global()
@Module({
  imports: [BillingModule, MessageModule],
  providers: [PaymentConsumer, UserConsumer, MessageConsumer, SendMailConsumer],
  exports: [],
})
export class RabbitConsumerModule {}
