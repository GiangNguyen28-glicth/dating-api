import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActionMongoRepoProvider } from '@dating/repositories';
import {
  MatchRequestModule,
  ConversationModule,
  UsersModule,
  SocketModule,
} from '@dating/modules';

import { ActionService } from './action.service';
import { Action, ActionSchema } from './entities';
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
