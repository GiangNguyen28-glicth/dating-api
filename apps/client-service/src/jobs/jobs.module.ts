import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './entities/job.entity';
import { UpdateFeatureAccessJob } from './update-feature-access.job';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }])],
  providers: [UpdateFeatureAccessJob],
  exports: [],
})
export class JobsModule {}
