import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { BillingProcess, BillingStatus, DEFAULT_LIKES_REMAINING, RequestDatingStatus } from '@common/consts';
import { IOptionFilterGetAll } from '@common/interfaces';
import { FilterBuilder } from '@dating/utils';

import { BillingService } from '@modules/billing/billing.service';
import { UserService } from '@modules/users/users.service';
import { ScheduleService } from '@modules/schedule/schedule.service';

import { Billing } from '@modules/billing/entities';
import { User } from '@modules/users/entities';

import { Job, JobModelType } from '../entities';
import { Schedule } from '@modules/schedule/entities';
import moment from 'moment-timezone';
import { Types } from 'mongoose';

@Injectable()
export class PullerService {
  constructor(
    @InjectModel(Job.name) private jobModel: JobModelType,
    private userService: UserService,
    private billingService: BillingService,
    private scheduleService: ScheduleService,
  ) {}

  async getAllBillingToUpdateFT(): Promise<Billing[]> {
    const data = await this.billingService.findAll({
      expiredDate: new Date(),
      status: BillingStatus.SUCCESS,
      process: BillingProcess.INPROGRESS,
    });
    return data.results;
  }

  async getAllUser(option?: IOptionFilterGetAll<User>): Promise<User[]> {
    return await this.userService.findAll(option);
  }

  async getAllUserToUpdateFT(): Promise<User[]> {
    const [queryFilter, sortOption] = new FilterBuilder<User>()
      .setFilterItemWithObject('featureAccess.likes.amount', {
        $lt: DEFAULT_LIKES_REMAINING,
      })
      .setFilterItemWithObject('featureAccess.likes.unlimited', {
        $eq: false,
      })
      .setSortItem('createdAt', 'asc')
      .buildQuery();
    return await this.userService.findAll({ queryFilter, sortOption });
  }

  async getScheduleByAppointmentDate(job: Job): Promise<Schedule[]> {
    const startOfDate = moment.tz('Asia/Ho_Chi_Minh').startOf('day');
    const tomorrow = startOfDate.add(1, 'day').endOf('day');
    const [queryFilter, sortOption] = new FilterBuilder<Schedule>()
      .setFilterItem('status', '$eq', RequestDatingStatus.ACCEPT)
      .setFilterItem('isDeleted', '$eq', false, true)
      .setFilterItemWithObject('appointmentDate', { $lte: tomorrow, $gte: startOfDate })
      .setFilterItem('_id', '$gte', new Types.ObjectId(job.lastId) || null)
      .setSortItem('_id', 'asc')
      .buildQuery();
    return await this.scheduleService.getScheduleByAppointmentDateJob(queryFilter, sortOption);
  }
}
