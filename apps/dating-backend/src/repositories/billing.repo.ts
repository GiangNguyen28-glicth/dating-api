import { InjectModel } from '@nestjs/mongoose';

import {
  BillingModelType,
  CrudRepo,
  DATABASE_TYPE,
  PROVIDER_REPO,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Billing } from '@modules/billing/entities';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BillingRepo extends CrudRepo<Billing> {}
export class BillingMongoRepo extends MongoRepo<Billing> {
  constructor(
    @InjectModel(Billing.name)
    protected billingModel: BillingModelType,
  ) {
    super(billingModel);
  }
}

export const BillingMongoRepoProvider = {
  provide: PROVIDER_REPO.BILLING + DATABASE_TYPE.MONGO,
  useClass: BillingMongoRepo,
};
