import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { FilterBuilder } from '@dating/utils';
import { IOptionFilterGetAll } from '@common/interfaces';
import { BillingProcess, BillingStatus, DEFAULT_LIKES_REMAINING } from '@common/consts';

import { BillingService } from '@modules/billing/billing.service';
import { UserService } from '@modules/users/users.service';

import { User } from '@modules/users/entities';
import { Billing } from '@modules/billing/entities';

import { Job, JobModelType } from '../entities';

@Injectable()
export class PullerService {
  constructor(
    @InjectModel(Job.name) private jobModel: JobModelType,
    private userService: UserService,
    private billingService: BillingService,
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
}
