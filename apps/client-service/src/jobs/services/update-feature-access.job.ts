import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';

import { JobStatus } from '@common/consts';
import { Job } from '../entities';
import { JobsService } from '../jobs.service';
import { BuilderService, PullerService, UpdaterService } from '../processors';

const UPDATE_USER_FEATURE_ACCESS = 'UPDATE_USER_FEATURE_ACCESS';
const UPDATE_BATCH_SIZE = 500;
@Injectable()
export class UpdateFeatureAccessJob {
  private cronJob: CronJob;
  constructor(
    private pullerService: PullerService,
    private builderService: BuilderService,
    private updaterService: UpdaterService,
    private jobService: JobsService,
  ) {
    this.cronJob = new CronJob(
      '14 20 * * *',
      async () => {
        console.log('Hello world');
        await this.process();
        // your code to run every 12PM
      },
      null,
      true,
      'Asia/Ho_Chi_Minh',
    );
    this.start();
  }

  async process(): Promise<void> {
    const job: Job = {
      name: UPDATE_USER_FEATURE_ACCESS,
      status: JobStatus.TODO,
    };
    const jobDoc = await this.jobService.createJob(job);
    try {
      const users = await this.pullerService.getAllUserToUpdateFT();
      jobDoc.totalUpdate = users.length;
      while (users.length) {
        const batchUsers = users.splice(0, UPDATE_BATCH_SIZE);
        const updateMany = this.builderService.buildUpdateManyUsersFT(batchUsers);
        await this.updaterService.updateUserFT(updateMany);
        if (jobDoc.status === JobStatus.TODO) {
          jobDoc.status = JobStatus.INPROGRESS;
          await this.jobService.save(jobDoc);
        }
      }
      jobDoc.status = JobStatus.DONE;
      await this.jobService.save(jobDoc);
    } catch (error) {
      jobDoc.status = JobStatus.ERROR;
      await this.jobService.save(jobDoc);
      return;
    }
  }

  async start() {
    this.cronJob.start();
  }

  async stop() {
    this.cronJob.stop();
  }
}
