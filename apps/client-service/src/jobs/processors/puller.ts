import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';

import {
  BillingProcess,
  BillingStatus,
  DATABASE_TYPE,
  DEFAULT_LIKES_REMAINING,
  MerchandisingType,
  PROVIDER_REPO,
  RequestDatingStatus,
} from '@common/consts';
import { IOptionFilterGetAll } from '@common/interfaces';
import { FilterBuilder } from '@dating/utils';

import { BillingService } from '@modules/billing/billing.service';
import { UserService } from '@modules/users/users.service';
import { ScheduleService } from '@modules/schedule/schedule.service';

import { Billing } from '@modules/billing/entities';
import { User } from '@modules/users/entities';
import { Schedule } from '@modules/schedule/entities';

import { Job, JobModelType } from '../entities';
import { Types } from 'mongoose';
import { BillingRepo, ScheduleRepo, UserRepo } from '@dating/repositories';

@Injectable()
export class PullerService {
  constructor(
    @InjectModel(Job.name) private jobModel: JobModelType,

    @Inject(PROVIDER_REPO.SCHEDULE + DATABASE_TYPE.MONGO)
    private scheduleRepo: ScheduleRepo,

    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,

    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private billingRepo: BillingRepo,
  ) {}

  async getAllBillingToUpdateFT(): Promise<Billing[]> {
    const data = await this.billingRepo.findAll({
      queryFilter: {
        expiredDate: new Date(),
        status: BillingStatus.SUCCESS,
        process: BillingProcess.INPROGRESS,
      },
    });
    return data;
  }

  async getAllUser(option?: IOptionFilterGetAll<User>): Promise<User[]> {
    return await this.userRepo.findAll(option);
  }

  async getAllUserToUpdateFT(): Promise<User[]> {
    const [queryFilter, sortOption] = new FilterBuilder<User>()
      .setFilterItem('isBlocked', '$eq', false, true)
      .setFilterItem('isDeleted', '$eq', false, true)
      // .setFilterItem('lastActiveDate','')
      .setSortItem('createdAt', 'asc')
      .buildQuery();
    return await this.userRepo.findAll({ queryFilter, sortOption });
  }

  async getScheduleByAppointmentDate(job: Job): Promise<Schedule[]> {
    let cursor = null;
    if (job.lastId) {
      cursor = new Types.ObjectId(job.lastId);
    }
    const startOfDate = moment.tz('Asia/Ho_Chi_Minh').startOf('day');
    const tomorrow = moment.tz('Asia/Ho_Chi_Minh').add(1, 'day').endOf('day');
    const [queryFilter, sortOption] = new FilterBuilder<Schedule>()
      .setFilterItem('status', '$eq', RequestDatingStatus.ACCEPT)
      .setFilterItem('isDeleted', '$eq', false, true)
      .setFilterItemWithObject('appointmentDate', { $lte: tomorrow, $gte: startOfDate })
      .setFilterItem('_id', '$gte', cursor)
      .setSortItem('_id', 'asc')
      .buildQuery();
    return await this.scheduleRepo.findAll({ queryFilter, sortOption });
  }

  async getScheduleToReview(job: Job): Promise<Schedule[]> {
    let cursor = null;
    if (job.lastId) {
      cursor = new Types.ObjectId(job.lastId);
    }
    const yesterday = moment.tz('Asia/Ho_Chi_Minh').startOf('day').subtract(1, 'day').startOf('day');
    const [queryFilter, sortOption] = new FilterBuilder<Schedule>()
      .setFilterItem('status', '$eq', RequestDatingStatus.ACCEPT)
      .setFilterItem('isDeleted', '$eq', false, true)
      .setFilterItemWithObject('appointmentDate', { $gte: yesterday })
      .setFilterItem('_id', '$gte', cursor)
      .setSortItem('_id', 'asc')
      .buildQuery();
    return await this.scheduleRepo.findAll({ queryFilter, sortOption });
  }
}
