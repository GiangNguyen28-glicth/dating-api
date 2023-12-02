import { InjectModel } from '@nestjs/mongoose';

import { CrudRepo, DATABASE_TYPE, PROVIDER_REPO, PassesRequestModelType } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { PassesRequest } from '@modules/match-request/entities';
import { GroupDate } from '@modules/admin/dto';

export interface PassesRequestRepo extends CrudRepo<PassesRequest> {
  statisticByRangeDate(filter, format: GroupDate): Promise<any>;
}
export class PassesRequestMongoRepo extends MongoRepo<PassesRequest> {
  constructor(
    @InjectModel(PassesRequest.name)
    protected passesRequestModel: PassesRequestModelType,
  ) {
    super(passesRequestModel);
  }

  async chartStatisticByRangeDate(filter, format: GroupDate): Promise<any> {
    return await this.passesRequestModel.aggregate([
      { $match: filter },
      {
        $addFields: {
          formattedDate: {
            $dateToString: { format: format, date: '$createdAt' },
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

export const PassesRequestMongoRepoProvider = {
  provide: PROVIDER_REPO.PASSES_REQUEST + DATABASE_TYPE.MONGO,
  useClass: PassesRequestMongoRepo,
};
