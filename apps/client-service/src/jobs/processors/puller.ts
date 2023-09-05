import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { FilterBuilder } from '@dating/utils';
import { UserService } from '@modules/users';
import { User } from '@modules/users/entities';
import { BillingService } from '@modules/billing';
import { Billing } from '@modules/billing/entities';
import { BillingStatus, DEFAULT_LIKES_REMAINING } from '@common/consts';
import { Job, JobModelType } from '../entities/job.entity';

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
    });
    return data.results;
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
