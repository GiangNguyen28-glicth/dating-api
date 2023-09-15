import { InjectModel } from '@nestjs/mongoose';

import { MatchRequestModelType, CrudRepo, DATABASE_TYPE, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { MatchRequest } from '@modules/match-request/entities';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MatchRequestRepo extends CrudRepo<MatchRequest> {}
export class MatchRequestMongoRepo extends MongoRepo<MatchRequest> {
  constructor(
    @InjectModel(MatchRequest.name)
    protected matchRequestModel: MatchRequestModelType,
  ) {
    super(matchRequestModel);
  }
}

export const MatchRequestMongoRepoProvider = {
  provide: PROVIDER_REPO.MATCH_REQUEST + DATABASE_TYPE.MONGO,
  useClass: MatchRequestMongoRepo,
};
