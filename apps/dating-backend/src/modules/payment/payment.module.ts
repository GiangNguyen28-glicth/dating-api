import { BillingModule } from '@modules/billing';
import { OfferingModule } from '@modules/offering';
import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [BillingModule, OfferingModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
