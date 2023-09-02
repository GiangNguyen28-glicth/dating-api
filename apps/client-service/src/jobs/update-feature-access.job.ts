import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';

@Injectable()
export class UpdateFeatureAccessJob {
  private job;
  constructor() {
    this.job = new CronJob('0 12 * * *', () => {
      console.log('Hello world');
      // your code to run every 12PM
    });
  }

  start() {
    this.job.start();
  }

  stop() {
    this.job.stop();
  }
}
