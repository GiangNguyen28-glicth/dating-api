import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';

import { JobStatus, TIME_ZONE } from '@common/consts';

import { BuilderService, PullerService, UpdaterService } from '../processors';
import { JobsService } from '../jobs.service';
import { IJobProcessors } from '../interfaces';
import { Job } from '../entities';

const REFRESH_FEATURE_ACCESS = 'REFRESH_FEATURE_ACCESS';
const UPDATE_BATCH_SIZE = 500;

@Injectable()
export class RefreshFeatureAccessJob implements IJobProcessors {
  private cronJob: CronJob;

  constructor(
    private pullerService: PullerService,
    private builderService: BuilderService,
    private updaterService: UpdaterService,
    private jobService: JobsService,
  ) {
    setTimeout(async () => {
      await this.process();
    });
    this.cronJob = new CronJob(
      '45 12 * * *',
      async () => {
        console.log('Refresh feature access !');
        // your code to run every 12PM
      },
      null,
      true,
      TIME_ZONE,
    );
    this.start();
  }

  async process(): Promise<void> {
    const job: Job = {
      name: REFRESH_FEATURE_ACCESS,
      status: JobStatus.TODO,
    };
    const jobDoc = await this.jobService.createJob(job);
    try {
      const billings = await this.pullerService.getAllBillingInprogress();
      while (billings.length) {
        const batchBillings = billings.splice(0, UPDATE_BATCH_SIZE);
        const { bulkBilling, bulkUser } = this.builderService.buildRefreshFeatureAccess(batchBillings);
        await this.updaterService.userBulkWriteUpdate(bulkUser);
        await this.updaterService.billingBulkWriteUpdate(bulkBilling);
        jobDoc.numOfProcessRecord += batchBillings.length;
        jobDoc.lastId = batchBillings[batchBillings.length - 1]._id;
        jobDoc.status = JobStatus.INPROGRESS;
        await this.jobService.save(jobDoc);
      }

      //   jobDoc.numOfProcessRecord += batchUsers.length;
      jobDoc.status = JobStatus.DONE;
      jobDoc.doneAt = new Date();
      await this.jobService.save(jobDoc);
    } catch (error) {
      jobDoc.status = JobStatus.ERROR;
      jobDoc.errorMessage = error.message;
      await this.jobService.save(jobDoc);
    }
  }

  async start() {
    this.cronJob.start();
  }

  async stop() {
    this.cronJob.stop();
  }
}
