import { CurrentUser } from '@common/decorators';
import { IResponse } from '@common/interfaces';
import { User } from '@modules/users/entities/user.entity';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CheckoutDTO } from './dto/card.dto';
import { PaymentService } from './payment.service';
import { AtGuard } from '@common/guards';

@ApiTags('Payment')
@Controller('payment')
@UseGuards(AtGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('stripe/checkout')
  @ApiBody({ type: CheckoutDTO })
  async createPaymentIntentStripe(
    @Body() checkoutDto: CheckoutDTO,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    try {
      await this.paymentService.createPaymentIntentStripe(user, checkoutDto);
      return {
        success: true,
        message:
          'Thanh toán thành công. Tài khoản của bạn sẽ được update trong ít phút',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
