import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BillingModule } from '@modules/billing';
import { ScheduleModule } from '@modules/schedule';
import { JwtService } from '@nestjs/jwt';

import { Job, JobSchema } from './entities';
import { BuilderService, PullerService, UpdaterService } from './processors';
import { JobsService } from './jobs.service';
import { ScheduleDatingJob, UpdateBillingExpiredJob, UpdateFeatureAccessJob } from './services';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]), BillingModule, ScheduleModule],
  providers: [
    JwtService,
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
