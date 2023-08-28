import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BillingModule } from '@modules/billing';
import { OfferingModule } from '@modules/offering';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QUEUE, SERVICE_NAME } from '@common/consts';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: SERVICE_NAME.PAYMENT_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: QUEUE.PAYMENT,
        },
      },
    ]),
    BillingModule,
    OfferingModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
