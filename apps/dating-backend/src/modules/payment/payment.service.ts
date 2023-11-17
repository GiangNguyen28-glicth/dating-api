import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfirmChannel } from 'amqplib';
import * as moment from 'moment-timezone';
import { isNil } from 'lodash';

import { RabbitService } from '@app/shared';
import {
  BillingStatus,
  LimitType,
  OfferingType,
  QUEUE_NAME,
  RMQ_CHANNEL,
  RefreshIntervalUnit,
  TIME_ZONE,
} from '@common/consts';
import { IResponse } from '@common/interfaces';
import { IPaymentMessage } from '@common/message';
import { docToObject } from '@dating/utils';

import { BillingService } from '@modules/billing/billing.service';
import { Billing } from '@modules/billing/entities';
import { Offering, Package } from '@modules/offering/entities';
import { OfferingService } from '@modules/offering/offering.service';
import { FeatureAccessItem, User } from '@modules/users/entities';

import { CheckoutDTO } from './dto';
import { StripePaymentStrategy } from './strategies/stripe.strategy';
import { CreateBillingDto } from '@modules/billing/dto';

@Injectable()
export class PaymentService implements OnModuleInit {
  private stripe: StripePaymentStrategy;
  private channel: ConfirmChannel;
  constructor(
    private configService: ConfigService,
    private billingService: BillingService,
    private offeringService: OfferingService,
    private rabbitService: RabbitService,
  ) {
    this.stripe = new StripePaymentStrategy(configService);
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
  }

  async createPaymentIntentStripe(user: User, checkoutDto: CheckoutDTO): Promise<IResponse> {
    try {
      const offering = await this.offeringService.findOne({ _id: checkoutDto.offeringId });
      const _package: Package = this.offeringService.getPackage(offering, checkoutDto.packageId);
      if (!_package) {
        throw new BadRequestException('Không tìm thấy Package');
      }

      checkoutDto.price = _package.price;

      const billingDto: CreateBillingDto = {
        latestPackage: _package,
        offering: offering._id,
        createdBy: user,
        offeringType: offering.type,
        lastMerchandising: offering.merchandising,
        expiredDate: this.getExpiredDate(_package.refreshInterval, _package.refreshIntervalUnit),
        isRetail: offering.isRetail ? true : false,
      };
      if (billingDto.isRetail) {
        billingDto.expiredDate = new Date();
      }
      billingDto.lastMerchandising = offering.merchandising.map(merItem => {
        if (merItem.type != LimitType.UNLIMITED) {
          merItem.refreshDate = moment().tz(TIME_ZONE).endOf('date').toDate();
        }
        return merItem;
      });

      const billing: Billing = await this.billingService.create(billingDto);

      if (offering.type === OfferingType.FINDER_BOOSTS) {
        if (!_package.amount) {
          throw new BadRequestException('Amount is not accept');
        }
        checkoutDto.price = _package.price;
      }

      const paymentIntent = await this.stripe.createPayment(user, checkoutDto);
      if (paymentIntent['status'] !== 'succeeded') {
        billing.status = BillingStatus.ERROR;
        await this.billingService.save(billing);
        throw new BadRequestException('Thanh toán thất bại');
      }
      const message: IPaymentMessage = {
        offeringType: offering.type,
        billingId: billing._id,
        userId: user._id,
      };
      if (offering.type != OfferingType.FINDER_BOOSTS) {
        message.featureAccess = this.buildMessage(offering, _package, user.featureAccess);
      } else if (offering.type === OfferingType.FINDER_BOOSTS) {
        message.boostsSession = {
          amount: _package.amount,
          refreshInterval: _package.refreshInterval,
          refreshIntervalUnit: _package.refreshIntervalUnit,
        };
      }
      await this.rabbitService.sendToQueue(QUEUE_NAME.UPDATE_FEATURE_ACCESS, message);
      return {
        success: true,
        message: 'Thanh toán thành công. Tài khoản của bạn sẽ được update trong ít phút',
      };
    } catch (error) {
      throw error;
    }
  }

  getExpiredDate(amount: number, refreshIntervalUnit: RefreshIntervalUnit): Date {
    const now = moment().tz(TIME_ZONE).endOf('date');
    return now.add(amount, refreshIntervalUnit.toLowerCase() as any).toDate();
  }

  buildMessage(offering: Offering, _package: Package, featureAccess: FeatureAccessItem[]): FeatureAccessItem[] {
    const { merchandising } = docToObject(offering);

    for (const merchandisingItem of merchandising) {
      const index = featureAccess.findIndex(item => item.name === merchandisingItem.name);
      if (isNil(index)) {
        const featureAccessItem: FeatureAccessItem = {
          unlimited: merchandisingItem.type === LimitType.UNLIMITED ? true : false,
          amount: merchandisingItem.amount,
          name: merchandisingItem.name,
        };
        featureAccess.push(featureAccessItem);
        continue;
      }
      if (merchandisingItem.type == LimitType.UNLIMITED) {
        featureAccess[index].unlimited = true;
      } else {
        featureAccess[index].unlimited = false;
        featureAccess[index].amount = merchandisingItem.amount;
      }
    }
    return featureAccess;
  }
}
