import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MatchRequestMongoRepoProvider } from '@dating/repositories';
import { ConversationModule } from '@modules/conversation';

import { MatchRequestService } from './match-request.service';
import { MatchRequestController } from './match-request.controller';
import { MatchRequest, MatchRequestSchema } from './entities';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MatchRequest.name, schema: MatchRequestSchema },
    ]),
    ConversationModule,
  ],
  controllers: [MatchRequestController],
  providers: [MatchRequestService, MatchRequestMongoRepoProvider],
  exports: [MatchRequestService, MatchRequestMongoRepoProvider],
})
export class MatchRequestModule {}
