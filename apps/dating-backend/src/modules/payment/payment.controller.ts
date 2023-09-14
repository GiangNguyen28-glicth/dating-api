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
    try {
      await this.paymentService.createPaymentIntentStripe(user, checkoutDto);
      return {
        success: true,
        message: 'Thanh toán thành công. Tài khoản của bạn sẽ được update trong ít phút',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
