import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BillingModule } from '@modules/billing';
import { ScheduleModule } from '@modules/schedule';

import { Job, JobSchema } from './entities';
import { BuilderService, PullerService, UpdaterService } from './processors';
import { JobsService } from './jobs.service';
import { ScheduleDatingJob, UpdateBillingExpiredJob, UpdateFeatureAccessJob } from './services';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]), BillingModule, ScheduleModule],
  providers: [
    PullerService,
    BuilderService,
    UpdaterService,
    JobsService,

    UpdateFeatureAccessJob,
    ScheduleDatingJob,
    UpdateBillingExpiredJob,
  ],
  exports: [],
})
export class JobsModule {}
