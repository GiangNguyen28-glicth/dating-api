import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { BillingModule } from '@modules/billing';
import { MessageModule } from '@modules/message';

import { MessageConsumer, PaymentConsumer, SendMailConsumer, UserConsumer } from './consumer';

@Global()
@Module({
  imports: [BillingModule, MessageModule],
  providers: [JwtService, PaymentConsumer, UserConsumer, MessageConsumer, SendMailConsumer],
  exports: [],
})
export class RabbitConsumerModule {}
