import { Injectable, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { ConfirmChannel } from 'amqplib';
import { get } from 'lodash';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { JobStatus, QUEUE_NAME, RMQ_CHANNEL } from '@common/consts';
import { RabbitService } from '@app/shared';

import { IReviewDating } from '@modules/schedule/interfaces';
import { Schedule } from '@modules/schedule/entities';

import { Job } from '../entities';
import { IJobProcessors } from '../interfaces';
import { JobsService } from '../jobs.service';
import { PullerService } from '../processors';

const SENT_NOTIFICATION_SCHEDULE_APPOINTMENT_DATE_TO_MAIL = 'SENT_NOTIFICATION_SCHEDULE_APPOINTMENT_DATE_TO_MAIL';

@Injectable()
export class ReviewDatingJob implements IJobProcessors, OnModuleInit {
  private cronJob: CronJob;
  private channel: ConfirmChannel;

  constructor(
    private pullerService: PullerService,
    private jobService: JobsService,
    private rabbitService: RabbitService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.cronJob = new CronJob(
      '45 12 * * *',
      async () => {
        console.log('ReviewDatingJob');
        await this.process();
        // your code to run every 12PM
      },
      null,
      true,
      'Asia/Ho_Chi_Minh',
    );
    this.start();
  }

  async onModuleInit() {
    await this.rabbitService.connectRmq();
    this.rabbitService.setChannelName(RMQ_CHANNEL.MAIL_CHANNEL);
    this.channel = await this.rabbitService.createChannel(RMQ_CHANNEL.MAIL_CHANNEL);

    await this.rabbitService.assertQueue(
      {
        queue: QUEUE_NAME.SEND_MAIL,
        options: {
          durable: true,
          arguments: {
            'x-queue-type': 'quorum',
          },
        },
      },
      RMQ_CHANNEL.MAIL_CHANNEL,
    );
  }

  async process(): Promise<void> {
    const job: Job = {
      name: SENT_NOTIFICATION_SCHEDULE_APPOINTMENT_DATE_TO_MAIL,
      status: JobStatus.TODO,
      numOfProcessRecord: 0,
    };
    const jobDoc = await this.jobService.createJob(job);
    try {
      const schedules = await this.pullerService.getScheduleToReview(job);
      job.totalUpdate = schedules.length;
      await this.processSendMail(schedules, jobDoc);
      jobDoc.status = JobStatus.DONE;
      jobDoc.doneAt = new Date();
      await this.jobService.save(jobDoc);
    } catch (error) {
      console.log(error);
      job.status = JobStatus.ERROR;
      await this.jobService.save(job);
      return;
    }
  }

  async getToken(payload: IReviewDating): Promise<string> {
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_VERIFICATION_REVIEW_SCHEDULE_TOKEN_SECRET'),
      expiresIn: this.configService.get<number>('JWT_VERIFICATION_REVIEW_SCHEDULE_EXPIRATION_TIME'),
    });
    return token;
  }

  async processSendMail(schedules: Schedule[], job: Job): Promise<void> {
    try {
      for (const schedule of schedules) {
        let totalProcess = 0;
        const senderMail: string = get(schedule, 'sender.email', null);
        if (senderMail) {
          await this.rabbitService.sendToQueue(
            QUEUE_NAME.SEND_MAIL,
            {
              to: senderMail,
              subject: 'Hello world',
              html: '<p>Haha</p>',
            },
            RMQ_CHANNEL.MAIL_CHANNEL,
          );
          totalProcess++;
        }
        const receiverMail: string = get(schedule, 'receiver.email', null);
        if (receiverMail) {
          await this.rabbitService.sendToQueue(
            QUEUE_NAME.SEND_MAIL,
            {
              to: receiverMail,
              subject: 'Hello world',
              html: '<p>Haha</p>',
            },
            RMQ_CHANNEL.MAIL_CHANNEL,
          );
          totalProcess++;
        }
        job.numOfProcessRecord += totalProcess;
        await this.jobService.save(job);
      }
    } catch (error) {
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
