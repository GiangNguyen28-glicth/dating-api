import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { InjectModel } from '@nestjs/mongoose';

import { IJob } from './interfaces';
import { Job, JobModelType } from './entities/job.entity';
import { JobStatus } from '@common/consts';
import { BuilderService, PullerService, UpdaterService } from './processors';

const UPDATE_USER_FEATURE_ACCESS = 'UPDATE_USER_FEATURE_ACCESS';
@Injectable()
export class UpdateFeatureAccessJob implements IJob {
  private cronJob: CronJob;
  constructor(
    @InjectModel(Job.name) private jobModel: JobModelType,
    private pullerService: PullerService,
    private builderService: BuilderService,
    private updaterService: UpdaterService,
  ) {
    this.cronJob = new CronJob(
      '0 47 9 * * *',
      () => {
        console.log('Hello world');
        // your code to run every 12PM
      },
      null,
      true,
      'Asia/Ho_Chi_Minh',
    );
    this.start();
  }

  async createJob(job: Job): Promise<Job> {
    try {
      return await this.jobModel.create(job);
    } catch (error) {
      throw error;
    }
  }

  async process(): Promise<void> {
    try {
      const job: Job = {
        name: UPDATE_USER_FEATURE_ACCESS,
        status: JobStatus.TODO,
      };
      await this.createJob(job);
      // const users = await
    } catch (error) {
      throw error;
    }
  }

  start() {
    this.cronJob.start();
  }

  stop() {
    this.cronJob.stop();
  }
}
