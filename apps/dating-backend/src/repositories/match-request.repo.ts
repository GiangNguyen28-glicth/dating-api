import { InjectModel } from '@nestjs/mongoose';

import { CrudRepo, DATABASE_TYPE, MatchRequestModelType, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { MatchRequest } from '@modules/match-request/entities';
import { GroupDate } from '@modules/admin/dto';
export interface MatchRequestRepo extends CrudRepo<MatchRequest> {
  statisticByRangeDate(filter, format: GroupDate): Promise<any>;
  statisticMatchedByRangeDate(filter, format: GroupDate): Promise<any>;
}
export class MatchRequestMongoRepo extends MongoRepo<MatchRequest> {
  constructor(
    @InjectModel(MatchRequest.name)
    protected matchRequestModel: MatchRequestModelType,
  ) {
    super(matchRequestModel);
  }

  async statisticMatchedByRangeDate(filter, format: GroupDate) {
    return await this.model.aggregate([
      { $match: filter },
      {
        $addFields: {
          formattedDate: {
            $dateToString: { format, date: '$updatedAt' },
          },
        },
      },
      {
        $group: {
          _id: {
            date: '$formattedDate',
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          date: '$_id.date',
          count: '$count',
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  }
}

export const MatchRequestMongoRepoProvider = {
  provide: PROVIDER_REPO.MATCH_REQUEST + DATABASE_TYPE.MONGO,
  useClass: MatchRequestMongoRepo,
};
