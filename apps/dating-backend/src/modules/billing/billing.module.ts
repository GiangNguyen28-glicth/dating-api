import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Billing, BillingSchema } from './entities/billing.entity';
import { BillingMongoRepoProvider } from '@dating/repositories';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingMongoRepoProvider],
  exports: [BillingService, BillingMongoRepoProvider],
})
export class BillingModule {}
