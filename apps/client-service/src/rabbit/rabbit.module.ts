import { Global, Module } from '@nestjs/common';
import { RabbitService } from './rabbit.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitConsumer } from './rabbit.consumer';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: 'amqp://localhost:5672',
      exchanges: [
        {
          name: 'exchange1',
          type: 'direct',
        },
      ],
      connectionInitOptions: { wait: false },
    }),
  ],
  providers: [RabbitService, RabbitConsumer],
  exports: [RabbitService, RabbitMQModule],
})
export class RabbitModule {}
