import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleMongoRepoProvider } from '@dating/repositories';

import { ConversationModule } from '@modules/conversation';

import { Schedule, ScheduleSchema } from './entities';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Schedule.name, schema: ScheduleSchema }]), ConversationModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleMongoRepoProvider],
  exports: [],
})
export class ScheduleModule {}
