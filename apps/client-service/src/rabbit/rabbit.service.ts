import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConfirmChannel, Connection, ConsumeMessage } from 'amqplib';
import { IExchangeRb, IQueue, IQueueBinding } from './interfaces/rabbit';
import {
  RabbitAssertExchange,
  RabbitAssertQueue,
} from './interfaces/rabbit.assert';
import { QUEUE } from '@common/index';
import { encodeImageToBlurhash } from '../images/images.builder';
import { IImageBuilder, UserService } from '@modules/users';

const DEFAULT_CHANNEL_ID = 'default_channel';
@Injectable()
export class RabbitService implements OnModuleInit, OnModuleDestroy {
  private channels: { [conId: string]: ConfirmChannel } = {};
  private connection: Connection;

  constructor(private readonly userService: UserService) {}

  onModuleDestroy() {
    this.connection.close();
  }
  async onModuleInit() {
    await this.connectRmq();
    await this.createChannel();
    await this.consume();
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

  async consume() {
    await this.channels[DEFAULT_CHANNEL_ID].prefetch(15);
    await this.startConsuming();
  }

  async startConsuming(): Promise<void> {
    const hook = async () => {
      this.channels[DEFAULT_CHANNEL_ID].consume(
        QUEUE.IMAGES_BUILDER,
        async msg => {
          try {
            const data: IImageBuilder = JSON.parse(msg.content.toString());
            await Promise.all(
              data.images.map(async image => {
                if (!image.blur) {
                  console.log('Start blur image');
                  image.blur = await encodeImageToBlurhash(image.url);
                  console.log(image.blur);
                }
              }),
            );
            console.log('MES:', msg);
            await this.userService.findOneAndUpdate(data.userId, {
              images: data.images,
            });
            await this.channels[DEFAULT_CHANNEL_ID].ack(msg);
          } catch (error) {
            console.log(error);
          }
        },
      );
    };
    await hook();
  }
}
