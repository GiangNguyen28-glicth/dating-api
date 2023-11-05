import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';

import { JobStatus } from '@common/consts';

import { Billing } from '@modules/billing/entities';

import { BuilderService, PullerService, UpdaterService } from '../processors';
import { JobsService } from '../jobs.service';
import { IJobProcessors } from '../interfaces';
import { Job } from '../entities';
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
      const billings = await this.pullerService.getAllBillingToUpdateFT();
      const userIds = this.getAllUserIdsByBilling(billings);
      jobDoc.totalUpdate = userIds.length;
      while (userIds.length) {
        const batchUsers = userIds.splice(0, UPDATE_BATCH_SIZE);
        const batchBillings = billings.splice(0, UPDATE_BATCH_SIZE);

        const queryFilter: any = { _id: { $in: batchUsers } };
        const users = await this.pullerService.getAllUser({ queryFilter });

        const updateManyUser = this.builderService.buildUpdateManyUsersFT(users);
        const updateManyBilling = this.builderService.buildUpdateBillingExpired(batchBillings);
        await this.updaterService.updateUserFT(updateManyUser);
        await this.updaterService.updateManyBilling(updateManyBilling);
        if (jobDoc.status === JobStatus.TODO) {
          jobDoc.status = JobStatus.INPROGRESS;
        }
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

  getAllUserIdsByBilling(billings: Billing[]): string[] {
    return billings.map(billing => billing.createdBy.toString());
  }

  async start() {
    this.cronJob.start();
  }

  async stop() {
    this.cronJob.stop();
  }
}
