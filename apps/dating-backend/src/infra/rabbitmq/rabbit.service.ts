import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel, Connection, ConsumeMessage } from 'amqplib';
import { RabbitAssertQueue } from './rabbit.assert';
import { IQueue } from './rabbit.interface';
import { delay } from '@app/shared';
const DEFAULT_CHANNEL_ID = 'default_channel';

@Injectable()
export class RabbitService implements OnModuleInit {
  private channels: { [conId: string]: ConfirmChannel } = {};

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async onModuleInit() {
    await this.amqpConnection.managedChannel.waitForConnect(async () => {
      this.channels[DEFAULT_CHANNEL_ID] = this.amqpConnection.channel;
      // console.log(this.channels[DEFAULT_CHANNEL_ID]);
    });
  }

  async waitForConnect() {
    return new Promise(resolve => {
      this.amqpConnection.managedChannel.waitForConnect(async () => {
        await delay(1000);
        resolve('ok');
      });
    });
  }

  async assertQueue(
    queueOptions: IQueue,
    channelId: string = DEFAULT_CHANNEL_ID,
  ): Promise<RabbitAssertQueue> {
    const { queue, options } = queueOptions;
    return await this.channels[channelId].assertQueue(queue, options);
  }

  async createChannel(channelId: string = DEFAULT_CHANNEL_ID) {
    this.channels[channelId] =
      await this.amqpConnection.connection.createChannel();
    return this.channels[channelId];
  }

  async sendToQueue(
    queue: string,
    msg: any,
    channelId: string = DEFAULT_CHANNEL_ID,
  ) {
    await this.channels[channelId].sendToQueue(
      queue,
      Buffer.from(JSON.stringify(msg)),
    );
  }
}
