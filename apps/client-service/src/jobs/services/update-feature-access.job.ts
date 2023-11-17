import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { uniq } from 'lodash';

import { JobStatus } from '@common/consts';

import { JobsService } from '../jobs.service';
import { BuilderService, PullerService, UpdaterService } from '../processors';
import { Job } from '../entities';

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
    // setTimeout(async () => {
    //   await this.process();
    // });
    this.start();
  }

  async process(): Promise<void> {
    const job: Job = {
      name: UPDATE_USER_FEATURE_ACCESS,
      status: JobStatus.TODO,
    };
    const jobDoc = await this.jobService.createJob(job);
    try {
      const billings = await this.pullerService.getAllCreatedByBilling();
      const users = await this.pullerService.getAllUserToUpdateFT(uniq(billings));
      jobDoc.totalUpdate = users.length;
      while (users.length) {
        const batchUsers = users.splice(0, UPDATE_BATCH_SIZE);
        const updateMany = this.builderService.buildUpdateUserDefaultFeatureAccess(batchUsers);
        await this.updaterService.userBulkWriteUpdate(updateMany);
        jobDoc.numOfProcessRecord += batchUsers.length;
        jobDoc.lastId = batchUsers[batchUsers.length - 1]._id;
        await this.jobService.save(jobDoc);
      }
      jobDoc.status = JobStatus.DONE;
      jobDoc.doneAt = new Date();
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
