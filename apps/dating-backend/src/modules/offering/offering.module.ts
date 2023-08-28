import { Module } from '@nestjs/common';
import { OfferingService } from './offering.service';
import { OfferingController } from './offering.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Offering, OfferingSchema } from './entities/offering.entity';
import { OfferingMongoRepoProvider } from '@dating/repositories';

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
