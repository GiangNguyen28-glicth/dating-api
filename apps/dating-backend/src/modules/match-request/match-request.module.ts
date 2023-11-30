import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MatchRequestMongoRepoProvider, PassesRequestMongoRepoProvider } from '@dating/repositories';
import { ConversationModule } from '@modules/conversation';

import { MatchRequest, MatchRequestSchema, PassesRequest, PassesRequestSchema } from './entities';
import { MatchRequestController } from './match-request.controller';
import { MatchRequestService } from './match-request.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MatchRequest.name, schema: MatchRequestSchema },
      { name: PassesRequest.name, schema: PassesRequestSchema },
    ]),
    ConversationModule,
  ],
  controllers: [MatchRequestController],
  providers: [MatchRequestService, MatchRequestMongoRepoProvider, PassesRequestMongoRepoProvider],
  exports: [MatchRequestService],
})
export class MatchRequestModule {}
