import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RabbitConsumer {
  constructor(private readonly amqpConnection: AmqpConnection) {}
  @RabbitSubscribe({
    exchange: 'exchange1',
    routingKey: 'subscribe-route',
    queue: 'subscribe-queue',
  })
  public async pubSubHandler(msg) {
    console.log('=========================================');
    console.log(`Received message: ${JSON.stringify(msg)}`);
  }
}
