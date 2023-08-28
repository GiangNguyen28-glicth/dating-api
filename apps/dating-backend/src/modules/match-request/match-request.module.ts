import { Module } from '@nestjs/common';
import { MatchRequestService } from './match-request.service';
import { MatchRequestController } from './match-request.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MatchRequest,
  MatchRequestSchema,
} from './entities/match-request.entity';
import { MatchRequestMongoRepoProvider } from '@dating/repositories/match-request.repo';

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
