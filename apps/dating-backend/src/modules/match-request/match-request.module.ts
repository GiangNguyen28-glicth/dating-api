import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import { MatchRequestMongoRepoProvider } from '@dating/repositories';

import { MatchRequestService } from './match-request.service';
import { MatchRequestController } from './match-request.controller';
import { MatchRequest, MatchRequestSchema } from './entities';

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
