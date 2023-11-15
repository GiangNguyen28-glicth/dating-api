import { InjectModel } from '@nestjs/mongoose';
import { PipelineStage, PopulateOptions } from 'mongoose';

import { CrudRepo, DATABASE_TYPE, IBulkWrite, PROVIDER_REPO, UserModelType } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { User } from '@modules/users/entities';
import { GroupDate } from '@modules/admin/dto';
export interface UserRepo extends CrudRepo<User> {
  recommendation(filter: PipelineStage[]): User[];
  countRecommendation(filter: PipelineStage[]): number;
  populate(document: Document, populate: PopulateOptions[]): Promise<User>;
  bulkWrite(bulkWrite: IBulkWrite[]): Promise<void>;
  chartStatisticByRangeDate(filter, format: GroupDate): Promise<any>;
  deleteManyUser();
  migrateData(): Promise<User[]>;
}
export class UserMongoRepo extends MongoRepo<User> {
  constructor(@InjectModel(User.name) protected userModel: UserModelType) {
    super(userModel);
  }

  async recommendation(finalCond: PipelineStage[]): Promise<User[]> {
    const results: User[] = await this.userModel.aggregate(finalCond);
    return results;
  }

  async countRecommendation(finalCond: PipelineStage[]): Promise<number> {
    return (await this.userModel.aggregate(finalCond)).length;
  }

  async deleteManyUser() {
    await this.userModel.deleteMany();
  }

  async bulkWrite(bulkWrite: IBulkWrite[]): Promise<void> {
    await this.userModel.bulkWrite(bulkWrite as any);
  }

  async chartStatisticByRangeDate(filter, format: GroupDate): Promise<any> {
    return await this.userModel.aggregate([
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

  async migrateData(): Promise<User[]> {
    const users = await this.userModel.find();
    for (const user of users) {
      user.featureAccess = User.getDefaultFeatureAccess();
      // const tags: any[] = [
      //   '64ee243aa7626b0485f03331',
      //   '64ee243aa7626b0485f03350',
      //   '64ee243aa7626b0485f0336b',
      //   '64ee243aa7626b0485f03345',
      //   '64ee243aa7626b0485f03325',
      // ];
      user.featureAccess = User.getDefaultFeatureAccess();
      // user.tags = tags;
      // user.address = {
      //   country: 'Vietnam',
      //   province: 'Thành phố Hồ Chí Minh',
      //   district: 'Quận 7',
      //   fullAddress: '424, Tân Phú, Quận 7, Thành phố Hồ Chí Minh, Vietnam',
      //   route: '1',
      // };
      // user.homeTown = {
      //   province: 'Thành phố Hà Nội',
      // };
      // user.liveAt = {
      //   province: 'Thành phố Hồ Chí Minh',
      // };
      // user.jobs = ['Sinh viên'];
      // user.weight = 65;
      // user.height = 172;
      // const relationship: any[] = ['64e77e381be6f8d64cff5712'];
      // user.relationships = relationship;
      // user.stepStarted = 4;
      await user.save();
    }
    return users;
  }
}

export const UserMongoRepoProvider = {
  provide: PROVIDER_REPO.USER + DATABASE_TYPE.MONGO,
  useClass: UserMongoRepo,
};
