import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';

import { JobStatus } from '@common/consts';

import { Billing } from '@modules/billing/entities';

import { BuilderService, PullerService, UpdaterService } from '../processors';
import { JobsService } from '../jobs.service';
import { IJobProcessors } from '../interfaces';
import { Job } from '../entities';
const UPDATE_BILLING = 'UPDATE_BILLING';
const UPDATE_BATCH_SIZE = 500;

@Injectable()
export class UpdateBillingJob implements IJobProcessors {
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
      name: UPDATE_BILLING,
      status: JobStatus.TODO,
    };
    const jobDoc = await this.jobService.createJob(job);
    try {
      const billing = await this.pullerService.getAllBillingToUpdateFT();
      const userIds = this.getAllUserIdsByBilling(billing);
      jobDoc.totalUpdate = userIds.length;
      while (userIds.length) {
        const batchUsers = userIds.splice(0, UPDATE_BATCH_SIZE);
        const updateMany = this.builderService.buildUpdateManyUsersFT(batchUsers);
        await this.updaterService.updateUserFT(updateMany);
        if (jobDoc.status === JobStatus.TODO) {
          jobDoc.status = JobStatus.INPROGRESS;
          await this.jobService.save(jobDoc);
        }
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

  getAllUserIdsByBilling(billings: Billing[]): string[] {
    return billings.map(billing => billing.createdBy._id.toString());
  }

  async start() {
    this.cronJob.start();
  }

  async stop() {
    this.cronJob.stop();
  }
}
