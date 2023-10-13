import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BillingModule } from '@modules/billing';
import { ScheduleModule } from '@modules/schedule';

import { Job, JobSchema } from './entities';
import { UpdateFeatureAccessJob } from './services/update-feature-access.job';
import { BuilderService, PullerService, UpdaterService } from './processors';
import { JobsService } from './jobs.service';
import { ScheduleDatingJob } from './services/schedule-dating-mail.job';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]), BillingModule, ScheduleModule],
  providers: [UpdateFeatureAccessJob, ScheduleDatingJob, PullerService, BuilderService, UpdaterService, JobsService],
  exports: [],
})
export class JobsModule {}
