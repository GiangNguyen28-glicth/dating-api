import { InjectModel } from '@nestjs/mongoose';

import { MatchRequestModelType, CrudRepo, DATABASE_TYPE, PROVIDER_REPO, MatchRqStatus } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { MatchRequest } from '@modules/match-request/entities';

export interface MatchRequestRepo extends CrudRepo<MatchRequest> {
  skip(receiverId: string, senderId: string): Promise<void>;
}
export class MatchRequestMongoRepo extends MongoRepo<MatchRequest> {
  constructor(
    @InjectModel(MatchRequest.name)
    protected matchRequestModel: MatchRequestModelType,
  ) {
    super(matchRequestModel);
  }

  async skip(receiverId: string, senderId: string): Promise<void> {
    await this.matchRequestModel.findOneAndUpdate(
      {
        status: MatchRqStatus.REQUESTED,
        receiver: receiverId,
        sender: senderId,
      },
      { $set: { status: MatchRqStatus.SKIP } },
    );
  }
}

export const MatchRequestMongoRepoProvider = {
  provide: PROVIDER_REPO.MATCH_REQUEST + DATABASE_TYPE.MONGO,
  useClass: MatchRequestMongoRepo,
};
