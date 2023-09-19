import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationMongoRepoProvider } from '@dating/repositories';
import { MessageModule } from '@modules/message';

import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { Conversation, ConversationSchema } from './entities';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    forwardRef(() => MessageModule),
  ],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationMongoRepoProvider],
  exports: [ConversationService, ConversationMongoRepoProvider],
})
export class ConversationModule {}
