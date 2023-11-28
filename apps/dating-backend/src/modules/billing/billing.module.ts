import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingMongoRepoProvider } from '@dating/repositories';

import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Billing, BillingSchema } from './entities';

@Module({
  imports: [MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }])],
  controllers: [BillingController],
  providers: [BillingService, BillingMongoRepoProvider],
  exports: [BillingService, BillingMongoRepoProvider],
})
export class BillingModule {}
