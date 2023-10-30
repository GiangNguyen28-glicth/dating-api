import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';

import { RabbitService } from '@app/shared';
import { BillingRepo, UserRepo } from '@dating/repositories';
import { BillingStatus, DATABASE_TYPE, PROVIDER_REPO, QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { IPaymentMessage } from '@common/message';

@Injectable()
export class PaymentConsumer implements OnModuleInit, OnModuleDestroy {
  private channel: ConfirmChannel;

  constructor(
    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,

    @Inject(PROVIDER_REPO.BILLING + DATABASE_TYPE.MONGO)
    private billingRepo: BillingRepo,

    private rabbitService: RabbitService,
  ) {}

  onModuleDestroy() {
    return;
    throw new Error('Method not implemented.');
  }

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.channel = await this.rabbitService.createChannel(RMQ_CHANNEL.PAYMENT_CHANNEL);
    await this.rabbitService.assertQueue(
      {
        queue: QUEUE_NAME.UPDATE_FEATURE_ACCESS,
        options: {
          durable: true,
          arguments: {
            'x-queue-type': 'quorum',
          },
        },
      },
      RMQ_CHANNEL.PAYMENT_CHANNEL,
    );
    await Promise.all([this.consumePayment()]);
    await this.rabbitService.startConsuming(RMQ_CHANNEL.PAYMENT_CHANNEL);
  }

  async consumePayment(): Promise<void> {
    const hook = async () => {
      this.channel.consume(
        QUEUE_NAME.UPDATE_FEATURE_ACCESS,
        async msg => {
          try {
            const content: IPaymentMessage = this.rabbitService.getContentFromMessage(msg);
            await this.updateUserFeatureAccess(content);
            await this.channel.ack(msg);
          } catch (error) {
            await this.rabbitService.reject(msg, true, RMQ_CHANNEL.PAYMENT_CHANNEL);
          }
        },
        { noAck: false },
      );
    };
    this.rabbitService.pushToHooks(RMQ_CHANNEL.PAYMENT_CHANNEL, hook);
  }

  async updateUserFeatureAccess(msg: IPaymentMessage) {
    try {
      await this.billingRepo.findOneAndUpdate(msg.billingId, {
        status: BillingStatus.SUCCESS,
      });
      await this.userRepo.findOneAndUpdate(msg.userId, {
        featureAccess: msg.featureAccess,
      });
    } catch (error) {
      throw error;
    }
  }
}
