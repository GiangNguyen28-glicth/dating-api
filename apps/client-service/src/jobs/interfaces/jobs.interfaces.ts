import { Job } from '../entities/job.entity';

export interface IJob {
  createJob(job: Job);
}

export interface IJobProcessors {
  process(): void;
}
