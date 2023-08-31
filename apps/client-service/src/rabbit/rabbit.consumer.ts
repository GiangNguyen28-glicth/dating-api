import { delay } from '@app/shared';
import { BillingStatus, QUEUE } from '@common/consts';
import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { BillingService } from '@modules/billing/billing.service';
import { IPaymentMessage } from '@modules/payment/interfaces/message.interfaces';
import { IImageBuilder, UserService } from '@modules/users';
import { Injectable } from '@nestjs/common';
import { encodeImageToBlurhash } from '../images/images.builder';

@Injectable()
export class RabbitConsumer {
  constructor(
    private readonly userService: UserService,
    private billingService: BillingService,
  ) {}
  @RabbitSubscribe({
    queue: QUEUE.UPDATE_FEATURE_ACCESS,
  })
  async updateUserFeatureAccess(msg: IPaymentMessage) {
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

  @RabbitSubscribe({
    queue: QUEUE.IMAGES_BUILDER,
  })
  async imageBuilder(msg: IImageBuilder) {
    try {
      await Promise.all(
        msg.images.map(async image => {
          if (!image.blur) {
            image.blur = await encodeImageToBlurhash(image.url);
            console.log(image.blur);
          }
        }),
      );
      console.log('MES:', msg);
      await this.userService.findOneAndUpdate(msg.userId, {
        images: msg.images,
      });
    } catch (error) {
      console.log('Error', error);
      await delay(2000);
      return new Nack(true);
    }
  }
}
