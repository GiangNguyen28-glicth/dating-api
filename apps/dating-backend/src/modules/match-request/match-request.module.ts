import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MatchRequestService } from './match-request.service';
import { MatchRequestController } from './match-request.controller';
import { MatchRequest, MatchRequestSchema } from './entities';
import { MatchRequestMongoRepoProvider } from '@dating/repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MatchRequest.name, schema: MatchRequestSchema },
    ]),
  ],
  controllers: [MatchRequestController],
  providers: [MatchRequestService, MatchRequestMongoRepoProvider],
  exports: [MatchRequestService, MatchRequestMongoRepoProvider],
})
export class MatchRequestModule {}
