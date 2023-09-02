import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BillingStatus,
  LimitType,
  QUEUE,
  RefreshIntervalUnit,
} from '@common/consts';
import { IResponse } from '@common/interfaces';
import { BillingService } from '@modules/billing/billing.service';
import { Billing } from '@modules/billing/entities/billing.entity';
import { Offering, Package } from '@modules/offering/entities/offering.entity';
import { OfferingService } from '@modules/offering/offering.service';
import { FeatureAccess, User } from '@modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { docToObject } from '@dating/utils';

import { CheckoutDTO } from './dto/card.dto';
import { IPaymentMessage } from './interfaces/message.interfaces';
import { StripePaymentStrategy } from './strategies/stripe.strategy';
import { RabbitService } from '@app/shared';

@Injectable()
export class PaymentService {
  private stripe: StripePaymentStrategy;
  constructor(
    private configService: ConfigService,
    private billingService: BillingService,
    private offeringService: OfferingService,
    private rabbitService: RabbitService,
  ) {
    this.stripe = new StripePaymentStrategy(configService);
  }

  async onModuleInit() {
    await this.rabbitService.assertQueue({
      queue: QUEUE.UPDATE_FEATURE_ACCESS,
    });
  }

  async createPaymentIntentStripe(
    user: User,
    checkoutDto: CheckoutDTO,
  ): Promise<IResponse> {
    try {
      const offering = await this.offeringService.findOne(
        checkoutDto.offeringId,
      );
      const _package: Package = this.offeringService.getPackage(
        offering,
        checkoutDto.packageId,
      );
      if (!_package) {
        throw new BadRequestException('Không tìm thấy Package');
      }

      const billing: Billing = await this.billingService.create({
        latestPackage: _package,
        offering: offering._id.toString(),
        createdBy: user._id,
        lastMerchandising: offering.merchandising,
        status: BillingStatus.INPROGRESS,
        expiredDate: this.getExpiredDate(_package),
      });

      const paymentIntent = await this.stripe.createPayment(user, checkoutDto);
      if (paymentIntent['status'] !== 'succeeded') {
        await this.billingService.findOneAndUpdate(billing._id, {
          status: BillingStatus.ERROR,
        });
        throw new BadRequestException('Thanh toán thất bại');
      }
      const message = this.buildMessage(offering, _package, user.featureAccess);
      message['billingId'] = billing._id;
      message['userId'] = user._id;
      await this.rabbitService.sendToQueue(
        QUEUE.UPDATE_FEATURE_ACCESS,
        message,
      );
      return null;
    } catch (error) {
      throw error;
    }
  }

  getExpiredDate(_package: Package): Date {
    const now = new Date();
    const amount = _package.amount;
    switch (_package.refreshIntervalUnit) {
      case RefreshIntervalUnit.MONTH:
        now.setMonth(now.getMonth() + amount);
        break;
      case RefreshIntervalUnit.WEEK:
        now.setDate(now.getDate() + amount * 7);
      case RefreshIntervalUnit.YEAR:
        now.setFullYear(now.getFullYear() + amount);
        break;
      case RefreshIntervalUnit.DAY:
        now.setDate(now.getDate() + amount);
      default:
        throw new BadRequestException('Missing refreshIntervalUnit');
    }
    return now;
  }

  buildMessage(
    offering: Offering,
    _package: Package,
    featureAccess: FeatureAccess,
  ): IPaymentMessage {
    const { merchandising } = docToObject(offering);

    for (const key in merchandising) {
      if (!merchandising[key]) {
        continue;
      }
      if (merchandising[key].type == LimitType.UNLIMITED) {
        featureAccess[key].unlimited = true;
      } else {
        console.log(key);
        featureAccess[key].amount = _package.amount;
      }
    }
    return {
      userId: null,
      featureAccess,
      billingId: null,
    };
  }
}
