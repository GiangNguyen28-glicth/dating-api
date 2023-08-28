import {
  CrudRepo,
  DATABASE_TYPE,
  OfferingModelType,
  PROVIDER_REPO,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Offering } from '@modules/offering/entities/offering.entity';
import { InjectModel } from '@nestjs/mongoose';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OfferingRepo extends CrudRepo<Offering> {}
export class OfferingMongoRepo extends MongoRepo<Offering> {
  constructor(
    @InjectModel(Offering.name)
    protected offeringModel: OfferingModelType,
  ) {
    super(offeringModel);
  }
}

export const OfferingMongoRepoProvider = {
  provide: PROVIDER_REPO.OFFERING + DATABASE_TYPE.MONGO,
  useClass: OfferingMongoRepo,
};
