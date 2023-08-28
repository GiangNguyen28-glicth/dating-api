import { MessageMongoRepoProvider } from '@dating/repositories';
import { ConversationModule } from '@modules/conversation';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './entities/message.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    ConversationModule,
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageMongoRepoProvider],
  exports: [MessageService, MessageMongoRepoProvider],
})
export class MessageModule {}
