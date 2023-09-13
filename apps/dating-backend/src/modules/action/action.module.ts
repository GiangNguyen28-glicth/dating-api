import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActionMongoRepoProvider } from '@dating/repositories';
import { SocketModule } from '@modules/socket';
import { ConversationModule } from '@modules/conversation';
import { MatchRequestModule } from '@modules/match-request';
import { UsersModule } from '@modules/users';

import { ActionService } from './action.service';
import { Action, ActionSchema } from './entities/action.entity';
import { ActionController } from './action.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Action.name, schema: ActionSchema }]),
    forwardRef(() => SocketModule),
    forwardRef(() => UsersModule),
    MatchRequestModule,
    ConversationModule,
  ],
  controllers: [ActionController],
  providers: [ActionService, ActionMongoRepoProvider],
  exports: [ActionService, ActionMongoRepoProvider],
})
export class ActionModule {}
