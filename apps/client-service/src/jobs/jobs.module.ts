import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

import { BillingMongoRepoProvider, ScheduleMongoRepoProvider, UserMongoRepoProvider } from '@dating/repositories';

import { Job, JobSchema } from './entities';
import { BuilderService, PullerService, UpdaterService } from './processors';
import { JobsService } from './jobs.service';
import { ReviewDatingJob, ScheduleDatingJob, UpdateBillingExpiredJob, UpdateFeatureAccessJob } from './services';
import { Schedule, ScheduleSchema } from '@modules/schedule/entities';
import { User, UserSchema } from '@modules/users/entities';
import { Billing, BillingSchema } from '@modules/billing/entities';
import { Message, MessageSchema } from '@modules/message/entities';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Schedule.name, schema: ScheduleSchema }]),
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  providers: [
    JwtService,
    PullerService,
    BuilderService,
    UpdaterService,
    JobsService,

    ScheduleMongoRepoProvider,
    UserMongoRepoProvider,
    BillingMongoRepoProvider,

    UpdateFeatureAccessJob,
    ScheduleDatingJob,
    UpdateBillingExpiredJob,
    ReviewDatingJob,
  ],
  exports: [],
})
export class JobsModule {}
