import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';

import { JobStatus } from '@common/consts';

import { IJobProcessors } from '../interfaces';
import { Job } from '../entities';
import { JobsService } from '../jobs.service';
import { PullerService } from '../processors';
import { MailService } from '@modules/mail';
import { Schedule } from '@modules/schedule/entities';

const SENT_NOTIFICATION_SCHEDULE_APPOINTMENT_DATE_TO_MAIL = 'SENT_NOTIFICATION_SCHEDULE_APPOINTMENT_DATE_TO_MAIL';

@Injectable()
export class ScheduleDatingJob implements IJobProcessors {
  private cronJob: CronJob;

  constructor(private pullerService: PullerService, private jobService: JobsService, private mailService: MailService) {
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
      name: SENT_NOTIFICATION_SCHEDULE_APPOINTMENT_DATE_TO_MAIL,
      status: JobStatus.TODO,
      numOfProcessRecord: 0,
    };
    const jobDoc = await this.jobService.createJob(job);
    try {
      const schedules = await this.pullerService.getScheduleByAppointmentDate(job);
      job.totalUpdate = schedules.length;
      await this.processSendMail(schedules, jobDoc);
    } catch (error) {
      job.status = JobStatus.ERROR;
      await this.jobService.save(job);
      return;
    }
  }

  async processSendMail(schedules: Schedule[], job: Job): Promise<void> {
    try {
      for (const schedule of schedules) {
        // await Promise.all([
        //   this.mailService.sendMail((schedule.sender as User).)
        // ]);
      }
    } catch (error) {
      setTimeout(async () => {
        this.processSendMail(schedules, job);
      });
    }
  }

  async start() {
    this.cronJob.start();
  }

  async stop() {
    this.cronJob.stop();
  }
}
