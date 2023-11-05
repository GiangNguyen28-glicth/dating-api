import { Inject, Injectable } from '@nestjs/common';

import { User } from '@modules/users/entities';
import { Billing } from '@modules/billing/entities';
import { BillingRepo, UserRepo } from '@dating/repositories';

import { UserService } from '@modules/users/users.service';

import { IUpdateMany } from '../interfaces';
import { DATABASE_TYPE, IBulkWrite, PROVIDER_REPO } from '@common/consts';

@Injectable()
export class UpdaterService {
  constructor(
    @Inject(PROVIDER_REPO.BILLING + DATABASE_TYPE.MONGO)
    private billingRepo: BillingRepo,

    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,
  ) {}

  async updateUserFT(bulkWrite: IBulkWrite[]) {
    try {
      await this.userRepo.bulkWrite(bulkWrite);
    } catch (error) {
      throw error;
    }
  }

  async updateManyBilling(updateMany: IUpdateMany<Billing>) {
    try {
      const { ids, entities } = updateMany;
      await this.billingRepo.updateMany(ids, entities);
    } catch (error) {
      throw error;
    }
  }
}
