import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { RabbitService } from '../../rabbit';
import { IRabbitConsumer } from '../../rabbit/interfaces/rabbit';

@Injectable()
export class UsersConsumer
  implements OnModuleDestroy, OnModuleInit, IRabbitConsumer
{
  private channel: ConfirmChannel;
  constructor(private rmqService: RabbitService) {}
  async onModuleInit() {
    this.channel = await this.rmqService.createChannel();
    // await this.consume();
  }

  async consume() {
    await this.channel.prefetch(10);
    await this.startConsuming();
  }

  async startConsuming(): Promise<void> {
    const hook = async () => {
      this.channel.consume('TEST_QUE', async (msg: ConsumeMessage) => {
        if (msg) {
          this.channel.ack(msg);
        }
      });
    };
    await hook();
  }

  onModuleDestroy() {
    return;
  }
}
