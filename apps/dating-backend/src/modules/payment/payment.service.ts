import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment-timezone';

import { BillingStatus, LimitType, OfferingType, QUEUE_NAME, RMQ_CHANNEL, RefreshIntervalUnit } from '@common/consts';
import { IResponse } from '@common/interfaces';
import { BillingService } from '@modules/billing/billing.service';
import { Billing } from '@modules/billing/entities';
import { MerchandisingItem, Offering, Package } from '@modules/offering/entities';
import { OfferingService } from '@modules/offering/offering.service';
import { docToObject } from '@dating/utils';

import { CheckoutDTO } from './dto/card.dto';
import { StripePaymentStrategy } from './strategies/stripe.strategy';
import { RabbitService } from '@app/shared';
import { IPaymentMessage } from '@common/message';
import { BoostsSession, FeatureAccessItem, User } from '@modules/users/entities';

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
      const offering = await this.offeringService.findOne(checkoutDto.offeringId);
      const _package: Package = this.offeringService.getPackage(offering, checkoutDto.packageId);
      if (!_package) {
        throw new BadRequestException('Không tìm thấy Package');
      }

      checkoutDto.price = _package.price;

      const billing: Billing = await this.billingService.create({
        latestPackage: _package,
        offering: offering._id.toString(),
        createdBy: user,
        lastMerchandising: offering.merchandising,
        status: BillingStatus.INPROGRESS,
        expiredDate: this.getExpiredDate(_package.refreshIntervalUnit, _package.refreshInterval),
      });

      if (offering.type === OfferingType.FINDER_BOOSTS) {
        if (!checkoutDto.amount) {
          throw new BadRequestException('Amount is not accept');
        }
        checkoutDto.price = _package.price * checkoutDto.amount;
      }

      const paymentIntent = await this.stripe.createPayment(user, checkoutDto);
      if (paymentIntent['status'] !== 'succeeded') {
        await this.billingService.findOneAndUpdate(billing._id, {
          status: BillingStatus.ERROR,
        });
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
          amount: checkoutDto.amount,
          refreshIntervalUnit: _package.refreshIntervalUnit,
          refreshInterval: _package.refreshInterval,
          effectiveTime: _package.effectiveTime,
          effectiveUnit: _package.effectiveUnit,
        };
      }
      await this.rabbitService.sendToQueue(QUEUE_NAME.UPDATE_FEATURE_ACCESS, message);
      return null;
    } catch (error) {
      throw error;
    }
  }

  getExpiredDate(refreshIntervalUnit: RefreshIntervalUnit, amount: number): Date {
    const now = moment.tz('Asia/Ho_Chi_Minh');
    switch (refreshIntervalUnit) {
      case RefreshIntervalUnit.MINUTES:
        now.add(amount, 'minutes');
        break;
      case RefreshIntervalUnit.MONTH:
        now.add(amount, 'months').endOf('date');
        break;
      case RefreshIntervalUnit.WEEK:
        now.add(amount, 'weeks').endOf('date');
        break;
      case RefreshIntervalUnit.YEAR:
        now.add(amount, 'years').endOf('date');
        break;
      case RefreshIntervalUnit.DAY:
        now.add(amount, 'days').endOf('date');
        break;
      default:
        throw new BadRequestException('Missing refreshIntervalUnit');
    }
    return new Date(now.toISOString());
  }

  buildMessage(offering: Offering, _package: Package, featureAccess: FeatureAccessItem[]): FeatureAccessItem[] {
    const { merchandising } = docToObject(offering);

    for (const merchandisingItem of merchandising) {
      const index = featureAccess.findIndex(item => item.name === merchandisingItem.name);
      if (merchandisingItem.type == LimitType.UNLIMITED) {
        featureAccess[index].unlimited = true;
      } else {
        featureAccess[index].unlimited = false;
        featureAccess[index].amount = _package.refreshInterval;
      }
    }
    return featureAccess;
  }
}
