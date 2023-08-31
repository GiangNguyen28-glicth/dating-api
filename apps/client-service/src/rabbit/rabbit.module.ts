import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitConsumer } from './rabbit.consumer';
import { UsersModule } from '@modules/users';
import { BillingModule } from '@modules/billing';
import { RabbitService } from './rabbit.service';

@Global()
@Module({
  imports: [
    // RabbitMQModule.forRoot(RabbitMQModule, {
    //   uri: 'amqp://localhost:5672',
    //   channels: {
    //     default_channel: {
    //       prefetchCount: 15,
    //     },
    //   },
    //   connectionInitOptions: { wait: false },
    // }),
    UsersModule,
    BillingModule,
  ],
  providers: [RabbitService],
  // exports: [RabbitMQModule],
})
export class RabbitModule {}
