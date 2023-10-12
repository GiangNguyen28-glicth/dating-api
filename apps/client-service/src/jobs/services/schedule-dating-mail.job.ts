import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';

import { ScheduleService } from '@modules/schedule/schedule.service';

import { IJobProcessors } from '../interfaces';

@Injectable()
export class UpdateBillingJob implements IJobProcessors {
  private cronJob: CronJob;

  constructor(private scheduleService: ScheduleService) {
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
    throw new Error('Method not implemented.');
  }

  async start() {
    this.cronJob.start();
  }

  async stop() {
    this.cronJob.stop();
  }
}
