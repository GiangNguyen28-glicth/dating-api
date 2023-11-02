import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { IPaymentStrategy } from '../interfaces/payment.interfaces';
import { CheckoutDTO } from '../dto/card.dto';
import { User } from '@modules/users/entities/user.entity';

export class StripePaymentStrategy implements IPaymentStrategy {
  private stripeConfig: Stripe.StripeConfig = {
    apiVersion: '2022-11-15',
  };
  private stripe: Stripe;
  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_CLIENT_SECRET'), this.stripeConfig);
  }

  async createPayment(user: User, cardDto: CheckoutDTO): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    const paymentMethod = await this.createPaymentMethod(user, cardDto);
    const { id } = paymentMethod;
    const paymentIntent = await this.stripe.paymentIntents.create({
      //   customer: '123',
      setup_future_usage: 'on_session',
      amount: cardDto.price,
      currency: 'vnd',
      confirm: true,
      payment_method_types: ['card'],
      payment_method: id,
    });
    return paymentIntent;
  }

  async createPaymentMethod(user: User, card: CheckoutDTO): Promise<Stripe.Response<Stripe.PaymentMethod>> {
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card: card.cardNumber,
      billing_details: {
        name: card.holderName,
        address: {
          postal_code: card.postalCode,
        },
      },
    });
    // await this.stripe.paymentMethods.attach(paymentMethod.id, {
    //   customer: '123',
    // });
    return paymentMethod;
  }

  async createCustomer(email: string, name: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: email,
      name: name,
    });
    return customer.id;
  }
}
