import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitService } from './rabbit.service';
import { RabbitConsumer } from './rabbit.consumer';
import { UsersModule } from '@modules/users';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: 'amqp://localhost:5672',
      connectionInitOptions: { wait: false },
    }),
    UsersModule,
  ],
  providers: [RabbitService, RabbitConsumer],
  exports: [RabbitService, RabbitMQModule],
})
export class RabbitModule {}
