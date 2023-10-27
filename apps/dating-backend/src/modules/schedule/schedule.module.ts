import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

import { ScheduleMongoRepoProvider } from '@dating/repositories';

import { ConversationModule } from '@modules/conversation';

import { Schedule, ScheduleSchema } from './entities';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Schedule.name, schema: ScheduleSchema }]), ConversationModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleMongoRepoProvider, JwtService],
  exports: [ScheduleService, ScheduleMongoRepoProvider],
})
export class ScheduleModule {}
