import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OfferingMongoRepoProvider } from '@dating/repositories';

import { OfferingService } from './offering.service';
import { OfferingController } from './offering.controller';
import { Offering, OfferingSchema } from './entities';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offering.name, schema: OfferingSchema },
    ]),
  ],
  controllers: [OfferingController],
  providers: [OfferingService, OfferingMongoRepoProvider],
  exports: [OfferingService, OfferingMongoRepoProvider],
})
export class OfferingModule {}
