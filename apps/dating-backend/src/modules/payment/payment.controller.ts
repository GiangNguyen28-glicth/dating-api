import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse } from '@common/interfaces';
import { User } from '@modules/users/entities';

import { PaymentService } from './payment.service';
import { CheckoutDTO } from './dto';

@ApiTags('Payment')
@Controller('payment')
@UseGuards(AtGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('stripe/checkout')
  @ApiBody({ type: CheckoutDTO })
  async createPaymentIntentStripe(@Body() checkoutDto: CheckoutDTO, @CurrentUser() user: User): Promise<IResponse> {
    return await this.paymentService.createPaymentIntentStripe(user, checkoutDto);
  }
}
