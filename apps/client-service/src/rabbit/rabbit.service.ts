import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConfirmChannel, Connection, ConsumeMessage } from 'amqplib';
import { IExchangeRb, IQueue, IQueueBinding } from './interfaces/rabbit';
import {
  RabbitAssertExchange,
  RabbitAssertQueue,
} from './interfaces/rabbit.assert';

const DEFAULT_CHANNEL_ID = 'default_channel';
@Injectable()
export class RabbitService implements OnModuleInit, OnModuleDestroy {
  private channels: { [conId: string]: ConfirmChannel } = {};
  private connection: Connection;

  onModuleDestroy() {
    this.connection.close();
  }
  async onModuleInit() {
    await this.connectRmq();
  }

  async exchange(
    exchangeRb: IExchangeRb,
    channelId: string = DEFAULT_CHANNEL_ID,
  ): Promise<RabbitAssertExchange> {
    const { exchange, type, options } = exchangeRb;
    return await this.channels[channelId].assertExchange(
      exchange,
      type,
      options,
    );
  }

  async bindQueue(
    bindQueue: IQueueBinding,
    channelId: string = DEFAULT_CHANNEL_ID,
  ) {
    const { queue, exchange, routingKey } = bindQueue;
    await this.exchange({ exchange, type: 'direct' });
    await this.assertQueue({ queue });
    return await this.channels[channelId].bindQueue(
      queue,
      exchange,
      routingKey,
    );
  }

  async assertQueue(
    queueOptions: IQueue,
    channelId: string = DEFAULT_CHANNEL_ID,
  ): Promise<RabbitAssertQueue> {
    const { queue, options } = queueOptions;
    return await this.channels[channelId].assertQueue(queue, options);
  }

  async connectRmq(): Promise<void> {
    try {
      if (!this.connection) {
        this.connection = await amqp.connect('amqp://localhost:5672');
      }
      return this.connection;
    } catch (error) {
      console.log('Connect to Rmq error. Try to reconnect');
      setTimeout(this.connectRmq.bind(this), 3000);
    }
  }

  async createChannel(channelId: string = DEFAULT_CHANNEL_ID) {
    this.channels[channelId] = await this.connection.createChannel();
    return this.channels[channelId];
  }

  async sendToQueue(
    queue: string,
    msg: any,
    channelId: string = DEFAULT_CHANNEL_ID,
  ) {
    this.channels[channelId].sendToQueue(queue, Buffer.from(msg.toString()));
  }

  async commit(msg: ConsumeMessage, channelId: string = DEFAULT_CHANNEL_ID) {
    await this.channels[channelId].ack(msg);
  }
}
