import { ApiBody, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CurrentUser } from '@common/decorators';
import { IResponse } from '@common/interfaces';
import { User } from '@modules/users/entities/user.entity';
import { CheckoutDTO } from './dto/card.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

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

  @Get()
  async test() {
    await this.amqpConnection.channel.assertQueue('subscribe-queue');
    await this.amqpConnection.channel.sendToQueue(
      'subscribe-queue',
      new Buffer('Hello, Anonystick!'),
    );
  }
}
