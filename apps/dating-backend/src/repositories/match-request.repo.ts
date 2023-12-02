import { InjectModel } from '@nestjs/mongoose';

import { CrudRepo, DATABASE_TYPE, MatchRequestModelType, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { MatchRequest } from '@modules/match-request/entities';
import { GroupDate } from '@modules/admin/dto';
export interface MatchRequestRepo extends CrudRepo<MatchRequest> {
  statisticByRangeDate(filter, format: GroupDate): Promise<any>;
}
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
