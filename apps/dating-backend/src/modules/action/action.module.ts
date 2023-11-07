import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActionMongoRepoProvider } from '@dating/repositories';
import { MatchRequestModule } from '@modules/match-request';
import { OfferingModule } from '@modules/offering';

import { ActionController } from './action.controller';
import { ActionService } from './action.service';
import { Action, ActionSchema } from './entities';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Action.name, schema: ActionSchema }]),
    MatchRequestModule,
    OfferingModule,
  ],
  controllers: [ActionController],
  providers: [ActionService, ActionMongoRepoProvider],
  exports: [ActionService, ActionMongoRepoProvider],
})
export class ActionModule {}
