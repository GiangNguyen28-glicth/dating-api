import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConfirmChannel, Connection, ConsumeMessage } from 'amqplib';

import { RabbitAssertExchange, RabbitAssertQueue } from './rabbitmq.assert';
import { IExchangeRb, IQueue, IQueueBinding } from './rabbitmq.interfaces';

const DEFAULT_CHANNEL_ID = 'default_channel';
@Injectable()
export class RabbitService implements OnModuleInit, OnModuleDestroy {
  private channels: { [conId: string]: ConfirmChannel } = {};
  private hooks: { [conId: string]: ((conId: string) => Promise<void>)[] } = {};
  private connection: Connection;
  private channelName: string;

  onModuleDestroy() {
    console.log('Close connection');
    this.connection.close();
  }

  async onModuleInit() {
    await this.connectRmq();
    await this.createChannel();
  }

  async exchange(exchangeRb: IExchangeRb, channelId: string = DEFAULT_CHANNEL_ID): Promise<RabbitAssertExchange> {
    const { exchange, type, options } = exchangeRb;
    return await this.channels[channelId].assertExchange(exchange, type, options);
  }

  async bindQueue(bindQueue: IQueueBinding, channelId: string = DEFAULT_CHANNEL_ID) {
    const { queue, exchange, routingKey } = bindQueue;
    await this.exchange({ exchange, type: 'direct' });
    await this.assertQueue({ queue });
    return await this.channels[channelId].bindQueue(queue, exchange, routingKey);
  }

  async assertQueue(queueOptions: IQueue, channelId: string = DEFAULT_CHANNEL_ID): Promise<RabbitAssertQueue> {
    const { queue, options } = queueOptions;
    return await this.channels[channelId].assertQueue(queue, options);
  }

  async connectRmq(): Promise<void> {
    try {
      if (!this.connection) {
        console.log('Open the new connection :D');
        this.connection = await amqp.connect(
          `amqp://${process.env.RABBIT_USERNAME}:${process.env.RABBIT_PASSWORD}@${process.env.RABBIT_HOST}:${process.env.RABBIT_PORT}`,
        );
      }
      this.connection.on(
        'error',
        (async (error: Error) => {
          console.log('Connect error:', error);
          await this.createChannel(this.channelName);
        }).bind(this),
      );
    } catch (error) {
      console.log('Connect to Rmq error. Try to reconnect');
      await this.connectRmq();
    }
  }

  async createChannel(channelId: string = DEFAULT_CHANNEL_ID) {
    if (!this.connection) {
      setTimeout(async () => {
        await this.createChannel(channelId);
      }, 3000);
      return;
    }
    this.channels[channelId] = await this.connection.createChannel();
    this.channels[channelId]?.on(
      'error',
      (async (error: Error) => {
        console.log('Hello error: ', error);
        await this.createChannel(channelId);
      }).bind(this),
    );

    this.channels[channelId]?.connection.on('heartbeat', () => {
      console.debug('Received a Heartbeat signal');
    });

    return this.channels[channelId];
  }

  async sendToQueue(queue: string, msg: any, channelId: string = DEFAULT_CHANNEL_ID) {
    try {
      await this.channels[channelId].sendToQueue(queue, Buffer.from(JSON.stringify(msg)), { persistent: true });
    } catch (error) {
      await this.sendToQueue(queue, msg, channelId);
    }
  }

  async reject(msg: ConsumeMessage, requeue?: boolean, channelId: string = DEFAULT_CHANNEL_ID) {
    await this.channels[channelId].reject(msg, requeue ?? true);
  }

  async pushToHooks(channelId: string = DEFAULT_CHANNEL_ID, hook: () => Promise<void>) {
    if (!this.hooks[channelId]) {
      this.hooks[channelId] = [];
    }
    this.hooks[channelId].push(hook);
  }

  async startConsuming(channelId: string = DEFAULT_CHANNEL_ID) {
    for (const hook of this.hooks[channelId]) {
      await hook(channelId);
    }
  }

  getContentFromMessage(msg: ConsumeMessage) {
    return JSON.parse(msg.content.toString());
  }

  setChannelName(channelName: string) {
    this.channelName = channelName;
  }
}
