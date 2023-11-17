import { Inject, Injectable } from '@nestjs/common';

import { BillingRepo, UserRepo } from '@dating/repositories';
import { DATABASE_TYPE, IBulkWrite, PROVIDER_REPO } from '@common/consts';

import { Billing } from '@modules/billing/entities';

import { IUpdateMany } from '../interfaces';

@Injectable()
export class UpdaterService {
  constructor(
    @Inject(PROVIDER_REPO.BILLING + DATABASE_TYPE.MONGO)
    private billingRepo: BillingRepo,

    @Inject(PROVIDER_REPO.USER + DATABASE_TYPE.MONGO)
    private userRepo: UserRepo,
  ) {}

  async userBulkWriteUpdate(bulkWrite: IBulkWrite[]) {
    try {
      if (!bulkWrite.length) {
        console.log('IBulkWrite dont have data. Skip user update');
      }
      await this.userRepo.bulkWrite(bulkWrite);
    } catch (error) {
      throw error;
    }
  }

  async billingBulkWriteUpdate(bulkWrite: IBulkWrite[]) {
    try {
      if (!bulkWrite.length) {
        console.log('IBulkWrite dont have data. Skip billing update');
      }
      await this.billingRepo.bulkWrite(bulkWrite);
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
