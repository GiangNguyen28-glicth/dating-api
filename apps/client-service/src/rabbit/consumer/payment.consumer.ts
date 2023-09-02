import { ConfirmChannel } from 'amqplib';
import { IRabbitConsumer, RabbitService, delay } from '@app/shared';
import { BillingStatus, QUEUE, RMQ_CHANNEL } from '@common/consts';
import { BillingService } from '@modules/billing';
import { IPaymentMessage } from '@modules/payment';
import { UserService } from '@modules/users';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PaymentConsumer implements OnModuleInit, OnModuleDestroy {
  private channel: ConfirmChannel;

  constructor(
    private userService: UserService,
    private billingService: BillingService,
    private rabbitService: RabbitService,
  ) {}

  onModuleDestroy() {
    return;
    throw new Error('Method not implemented.');
  }

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.channel = await this.rabbitService.createChannel(
      RMQ_CHANNEL.PAYMENT_CHANNEL,
    );
    await this.rabbitService.assertQueue(
      {
        queue: QUEUE.UPDATE_FEATURE_ACCESS,
      },
      RMQ_CHANNEL.PAYMENT_CHANNEL,
    );
    await Promise.all([await this.consumePayment()]);
    await this.rabbitService.startConsuming(RMQ_CHANNEL.PAYMENT_CHANNEL);
  }

  async consumePayment(): Promise<void> {
    const hook = async () => {
      this.channel.consume(
        QUEUE.UPDATE_FEATURE_ACCESS,
        async msg => {
          try {
            const content: IPaymentMessage =
              this.rabbitService.getContentFromMessage(msg);
            await this.updateUserFeatureAccess(content);
            await this.channel.ack(msg);
          } catch (error) {
            await this.rabbitService.reject(
              msg,
              true,
              RMQ_CHANNEL.PAYMENT_CHANNEL,
            );
          }
        },
        { noAck: false },
      );
    };
    this.rabbitService.pushToHooks(RMQ_CHANNEL.PAYMENT_CHANNEL, hook);
  }

  async updateUserFeatureAccess(msg: IPaymentMessage) {
    try {
      await this.billingService.findOneAndUpdate(msg.billingId, {
        status: BillingStatus.SUCCESS,
      });
      await this.userService.findOneAndUpdate(msg.userId, {
        featureAccess: msg.featureAccess,
      });
    } catch (error) {
      throw error;
    }
  }
}
