import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment-timezone';

import { BillingStatus, DATABASE_TYPE, PROVIDER_REPO, RequestDatingStatus, TIME_ZONE } from '@common/consts';
import { IOptionFilterGetAll } from '@common/interfaces';
import { FilterBuilder } from '@dating/utils';

import { Billing } from '@modules/billing/entities';
import { Schedule } from '@modules/schedule/entities';
import { User } from '@modules/users/entities';

import { BillingRepo, ScheduleRepo, UserRepo } from '@dating/repositories';
import { Types } from 'mongoose';
import { Job, JobModelType } from '../entities';

@Injectable()
export class PullerService {
  constructor(
    @InjectModel(Job.name) private jobModel: JobModelType,

    @Inject(PROVIDER_REPO.SCHEDULE + DATABASE_TYPE.MONGO)
    private scheduleRepo: ScheduleRepo,

    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,

    @Inject(PROVIDER_REPO.BILLING + DATABASE_TYPE.MONGO)
    private billingRepo: BillingRepo,
  ) {}

  async getAllBillingExpired(): Promise<Billing[]> {
    const [queryFilter] = new FilterBuilder<Billing>()
      .setFilterItem('expiredDate', '$lte', new Date())
      .setFilterItem('status', '$eq', BillingStatus.SUCCESS)
      .buildQuery();
    const data = await this.billingRepo.findAll({
      queryFilter,
    });
    return data;
  }

  async getAllBillingInprogress(): Promise<Billing[]> {
    const [queryFilter] = new FilterBuilder<Billing>()
      .setFilterItem('createdBy', '$eq', '6543ab06a9d84184e1987f6a')
      .setFilterItem('expiredDate', '$gte', new Date())
      .setFilterItem('status', '$eq', BillingStatus.SUCCESS)
      .setFilterItem('isRetail', '$eq', false, true)
      .buildQuery();
    return await this.billingRepo.findAll({
      queryFilter,
    });
  }

  async getAllCreatedByBilling(): Promise<string[]> {
    const [queryFilter] = new FilterBuilder<Billing>()
      .setFilterItem('expiredDate', '$gte', new Date())
      .setFilterItem('status', '$eq', BillingStatus.SUCCESS)
      .setFilterItem('isRetail', '$eq', false, true)
      .buildQuery();
    return await this.billingRepo.distinct('createdBy', {
      queryFilter,
    });
  }

  async getAllUser(option?: IOptionFilterGetAll<User>): Promise<User[]> {
    return await this.userRepo.findAll(option);
  }

  async getAllUserToUpdateFT(ignoreIds: string[] = [], inIds: string[] = []): Promise<User[]> {
    const queryBuilder = new FilterBuilder<User>()
      .setFilterItem('isBlocked', '$eq', false, true)
      .setFilterItem('isDeleted', '$eq', false, true);
    if (ignoreIds.length) {
      queryBuilder.setFilterItem('_id', '$nin', ignoreIds);
    }
    if (inIds.length) {
      queryBuilder.setFilterItem('_id', '$in', ignoreIds);
    }
    const [queryFilter, sortOption] = queryBuilder.setSortItem('createdAt', 'asc').buildQuery();
    return await this.userRepo.findAll({ queryFilter, sortOption });
  }

  async getScheduleByAppointmentDate(job: Job): Promise<Schedule[]> {
    let cursor = null;
    if (job.lastId) {
      cursor = new Types.ObjectId(job.lastId);
    }
    const startOfDate = moment.tz(TIME_ZONE).startOf('day');
    const tomorrow = moment.tz(TIME_ZONE).add(1, 'day').endOf('day');
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
    const yesterday = moment.tz(TIME_ZONE).startOf('day').toDate();
    const [queryFilter, sortOption] = new FilterBuilder<Schedule>()
      .setFilterItem('status', '$eq', RequestDatingStatus.ACCEPT)
      .setFilterItem('isDeleted', '$eq', false, true)
      .setFilterItem('isSendMailReview', '$eq', false, true)
      .setFilterItemWithObject('appointmentDate', { $lte: yesterday })
      .setFilterItem('_id', '$gte', cursor)
      .setSortItem('_id', 'asc')
      .buildQuery();
    const selectUserField: Array<keyof User> = ['_id', 'name', 'email'];
    return await this.scheduleRepo.findAll({
      queryFilter,
      sortOption,
      populate: [
        { path: 'sender', select: selectUserField.join(' ') },
        { path: 'receiver', select: selectUserField.join(' ') },
      ],
    });
  }
}
