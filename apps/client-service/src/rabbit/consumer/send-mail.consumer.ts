import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

import { RabbitService } from '@app/shared';
import { QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { ISendMail } from '@modules/mail/interfaces';
import { MailService } from '@modules/mail';

@Injectable()
export class SendMailConsumer implements OnModuleInit, OnModuleDestroy {
  private channel: ConfirmChannel;

  constructor(private rabbitService: RabbitService, private mailService: MailService) {}

  onModuleDestroy() {
    return;
    throw new Error('Method not implemented.');
  }

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.channel = await this.rabbitService.createChannel(RMQ_CHANNEL.MAIL_CHANNEL);
    await this.rabbitService.assertQueue(
      {
        queue: QUEUE_NAME.SEND_MAIL,
        options: {
          durable: true,
          arguments: {
            'x-queue-type': 'quorum',
          },
        },
      },
      RMQ_CHANNEL.MAIL_CHANNEL,
    );
    await Promise.all([this.consumeSendMail()]);
    await this.rabbitService.startConsuming(RMQ_CHANNEL.MAIL_CHANNEL);
  }

  async consumeSendMail(): Promise<void> {
    const hook = async () => {
      this.channel.consume(
        QUEUE_NAME.SEND_MAIL,
        async msg => {
          try {
            const content: ISendMail = this.rabbitService.getContentFromMessage(msg);
            await this.mailService.sendMail(content);
            await this.channel.ack(msg);
          } catch (error) {
            console.log(error);
            await this.rabbitService.reject(msg, true, RMQ_CHANNEL.MAIL_CHANNEL);
          }
        },
        { noAck: false },
      );
    };
    this.rabbitService.pushToHooks(RMQ_CHANNEL.MAIL_CHANNEL, hook);
  }
}
