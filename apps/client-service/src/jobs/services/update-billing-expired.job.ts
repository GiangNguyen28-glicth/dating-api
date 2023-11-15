import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';

import { JobStatus, TIME_ZONE } from '@common/consts';

import { Job } from '../entities';
import { IJobProcessors } from '../interfaces';
import { JobsService } from '../jobs.service';
import { BuilderService, PullerService, UpdaterService } from '../processors';
const UPDATE_BILLING = 'UPDATE_BILLING_EXPIRED';
const UPDATE_BATCH_SIZE = 500;

@Injectable()
export class UpdateBillingExpiredJob implements IJobProcessors {
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
      TIME_ZONE,
    );
    this.start();
  }

  async process(): Promise<void> {
    const job: Job = {
      name: UPDATE_BILLING,
      status: JobStatus.TODO,
    };
    const jobDoc = await this.jobService.createJob(job);
    try {
      const billings = await this.pullerService.getAllBillingExpired();
      while (billings.length) {
        const batchBillings = billings.splice(0, UPDATE_BATCH_SIZE);

        const updateManyBilling = this.builderService.buildUpdateBillingExpired(batchBillings);
        await this.updaterService.updateManyBilling(updateManyBilling);
        jobDoc.numOfProcessRecord += batchBillings.length;
        jobDoc.lastId = batchBillings[batchBillings.length - 1]._id;
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
