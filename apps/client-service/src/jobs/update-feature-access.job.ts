import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { InjectModel } from '@nestjs/mongoose';

import { IJob } from './interfaces';
import { Job, JobModelType } from './entities/job.entity';
import { JobStatus } from '@common/consts';
import { BuilderService, PullerService, UpdaterService } from './processors';
import { JobsService } from './jobs.service';

const UPDATE_USER_FEATURE_ACCESS = 'UPDATE_USER_FEATURE_ACCESS';
const UPDATE_BATCH_SIZE = 500;
@Injectable()
export class UpdateFeatureAccessJob {
  private cronJob: CronJob;
  constructor(
    @InjectModel(Job.name) private jobModel: JobModelType,
    private pullerService: PullerService,
    private builderService: BuilderService,
    private updaterService: UpdaterService,
    private jobService: JobsService,
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

  async process(): Promise<void> {
    try {
      const job: Job = {
        name: UPDATE_USER_FEATURE_ACCESS,
        status: JobStatus.TODO,
      };
      const jobDoc = await this.jobService.createJob(job);
      const users = await this.pullerService.getAllUserToUpdateFT();
      while (users.length) {
        const batchUsers = users.splice(0, UPDATE_BATCH_SIZE);
        const updateMany =
          this.builderService.buildUpdateManyUsersFT(batchUsers);
        await this.updaterService.updateUserFT(updateMany);
        if (jobDoc.status === JobStatus.TODO) {
          jobDoc.status = JobStatus.INPROGRESS;
          await this.jobService.save(jobDoc);
        }
      }
      jobDoc.status = JobStatus.DONE;
      await this.jobService.save(jobDoc);
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
