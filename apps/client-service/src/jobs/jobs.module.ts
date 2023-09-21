import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BillingModule } from '@modules/billing';

import { Job, JobSchema } from './entities';
import { UpdateFeatureAccessJob } from './services/update-feature-access.job';
import { BuilderService, PullerService, UpdaterService } from './processors';
import { JobsService } from './jobs.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]), BillingModule],
  providers: [UpdateFeatureAccessJob, PullerService, BuilderService, UpdaterService, JobsService],
  exports: [],
})
export class JobsModule {}
