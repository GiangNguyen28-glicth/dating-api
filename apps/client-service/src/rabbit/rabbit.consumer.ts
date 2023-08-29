import { delay } from '@app/shared';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { IPaymentMessage } from '@modules/payment/interfaces/message.interfaces';
import { UserService } from '@modules/users';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RabbitConsumer {
  constructor(private readonly userService: UserService) {}
  @RabbitSubscribe({
    queue: 'update_user_feature_access',
  })
  public async updateUserFeatureAccess(msg: IPaymentMessage) {
    try {
      await this.userService.findOneAndUpdate(msg.userId, {
        featureAccess: msg.featureAccess,
      });
    } catch (error) {
      await delay(2000);
      return new Nack(true);
    }
  }
}
