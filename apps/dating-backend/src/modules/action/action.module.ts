import { ActionMongoRepoProvider } from '@dating/repositories';
import { SocketModule } from '@modules/socket';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionService } from './action.service';
import { Action, ActionSchema } from './entites/action.entity';
import { ActionController } from './action.controller';
import { MatchRequestModule } from '@modules/match-request';
import { ConversationModule } from '@modules/conversation';
import { UsersModule } from '@modules/users';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Action.name, schema: ActionSchema }]),
    forwardRef(() => SocketModule),
    MatchRequestModule,
    forwardRef(() => UsersModule),
    ConversationModule,
  ],
  controllers: [ActionController],
  providers: [ActionService, ActionMongoRepoProvider],
  exports: [ActionService, ActionMongoRepoProvider],
})
export class ActionModule {}
