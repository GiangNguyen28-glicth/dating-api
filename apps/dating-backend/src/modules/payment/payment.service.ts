import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripePaymentStrategy } from './strategies/stripe.strategy';
import { CheckoutDTO } from './dto/card.dto';
import { FeatureAccess, User } from '@modules/users/entities/user.entity';
import { BillingService } from '@modules/billing/billing.service';
import { OfferingService } from '@modules/offering/offering.service';
import { BillingStatus, LimitType, SERVICE_NAME } from '@common/consts';
import { ClientRMQ } from '@nestjs/microservices';
import { Offering, Package } from '@modules/offering/entities/offering.entity';
import { Billing } from '@modules/billing/entities/billing.entity';
import { IPaymentMessage } from './interfaces/message.interfaces';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class PaymentService {
  private stripe: StripePaymentStrategy;
  constructor(
    @Inject(SERVICE_NAME.PAYMENT_SERVICE)
    private paymentClient: ClientRMQ,
    private configService: ConfigService,
    private billingService: BillingService,
    private offeringService: OfferingService,
    private readonly amqpConnection: AmqpConnection,
  ) {
    this.stripe = new StripePaymentStrategy(configService);
  }

  async createPaymentIntentStripe(user: User, checkoutDto: CheckoutDTO) {
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
        createdBy: user._id,
        lastMerchandising: offering.merchandising,
        status: BillingStatus.INPROGRESS,
      });

      const paymentIntent = await this.stripe.createPayment(user, checkoutDto);
      if (paymentIntent['status'] !== 'succeeded') {
        await this.billingService.findOneAndUpdate(billing._id, {
          status: BillingStatus.ERROR,
        });
        throw new BadRequestException('Thanh toán thất bại');
      }
      const message = this.buildMessage(offering, _package);
      message['userId'] = user._id;
      message['billingId'] = billing._id;
      // await this.amqpConnection.()
      return null;
    } catch (error) {
      throw error;
    }
  }

  async sendMessage(message): Promise<void> {}

  buildMessage(offering: Offering, _package: Package): IPaymentMessage {
    const { merchandising } = offering;
    const featureAccess: FeatureAccess = {
      hideAds: { unlimited: true },
    };
    const keys = ['likes', 'rewind', 'superLike'];
    for (const key in keys) {
      if (merchandising[key].type == LimitType.UNLIMITED) {
        featureAccess[key].unlimited = true;
      } else {
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
