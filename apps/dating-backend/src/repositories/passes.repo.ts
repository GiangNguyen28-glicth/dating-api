import { InjectModel } from '@nestjs/mongoose';

import { CrudRepo, DATABASE_TYPE, PROVIDER_REPO, PassesRequestModelType } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { PassesRequest } from '@modules/match-request/entities';

export type PassesRequestRepo = CrudRepo<PassesRequest>;
export class PassesRequestMongoRepo extends MongoRepo<PassesRequest> {
  constructor(
    @InjectModel(PassesRequest.name)
    protected passesRequestModel: PassesRequestModelType,
  ) {
    super(passesRequestModel);
  }
}

export const PassesRequestMongoRepoProvider = {
  provide: PROVIDER_REPO.PASSES_REQUEST + DATABASE_TYPE.MONGO,
  useClass: PassesRequestMongoRepo,
};
