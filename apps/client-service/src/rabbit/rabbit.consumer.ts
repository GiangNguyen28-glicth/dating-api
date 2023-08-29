import { delay } from '@app/shared';
import { BillingStatus } from '@common/consts';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { BillingService } from '@modules/billing/billing.service';
import { IPaymentMessage } from '@modules/payment/interfaces/message.interfaces';
import { UserService } from '@modules/users';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RabbitConsumer {
  constructor(
    private readonly userService: UserService,
    private billingService: BillingService,
  ) {}
  @RabbitSubscribe({
    queue: 'update_user_feature_access',
  })
  public async updateUserFeatureAccess(msg: IPaymentMessage) {
    try {
      await this.billingService.findOneAndUpdate(msg.billingId, {
        status: BillingStatus.SUCCESS,
      });
      await this.userService.findOneAndUpdate(msg.userId, {
        featureAccess: msg.featureAccess,
      });
    } catch (error) {
      await delay(2000);
      return new Nack(true);
    }
  }
}
