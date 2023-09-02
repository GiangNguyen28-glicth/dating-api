import { Global, Module } from '@nestjs/common';
import { UsersModule } from '@modules/users';
import { BillingModule } from '@modules/billing';
import { PaymentConsumer, UserConsumer } from './consumer';

@Global()
@Module({
  imports: [UsersModule, BillingModule],
  providers: [PaymentConsumer, UserConsumer],
  exports: [],
})
export class RabbitConsumerModule {}
