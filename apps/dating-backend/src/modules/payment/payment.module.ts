import { Module } from '@nestjs/common';

import { BillingModule, OfferingModule } from '@dating/modules';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [BillingModule, OfferingModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
