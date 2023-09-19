import { MongooseModule } from '@nestjs/mongoose';
import { Module, forwardRef } from '@nestjs/common';

import { MessageMongoRepoProvider } from '@dating/repositories';
import { ConversationModule } from '@modules/conversation';

import { Message, MessageSchema } from './entities';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    forwardRef(() => ConversationModule),
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageMongoRepoProvider],
  exports: [MessageService, MessageMongoRepoProvider],
})
export class MessageModule {}
