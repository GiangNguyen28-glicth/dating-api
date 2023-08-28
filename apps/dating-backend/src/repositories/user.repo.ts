import {
  CrudRepo,
  DATABASE_TYPE,
  PROVIDER_REPO,
  PaginationDTO,
  UserModelType,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { User } from '@modules/users/entities/user.entity';
import { UserHelper } from '@modules/users/helper/user.helper';
import { InjectModel } from '@nestjs/mongoose';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserRepo extends CrudRepo<User> {
  recommendation(user: User, filter, pagination: PaginationDTO);
  deleteManyUser();
  migrateData();
}
export class UserMongoRepo extends MongoRepo<User> {
  constructor(
    @InjectModel(User.name) protected userModel: UserModelType,
    private userHelper: UserHelper,
  ) {
    super(userModel);
  }

  async recommendation(
    user: User,
    filter,
    pagination: PaginationDTO,
  ): Promise<User[]> {
    const query: any = this.userHelper.getFilterByDistance(user, filter);
    const results: User[] = await this.userModel.aggregate([
      query,
      // {
      //   $lookup: {
      //     from: 'tags',
      //     let: { tags: '$tags' },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: { $in: ['$_id', '$$tags'] },
      //         },
      //       },
      //       {
      //         $project: {
      //           name: 1,
      //           type: 1,
      //           parentType: 1,
      //         },
      //       },
      //     ],
      //     as: 'tags',
      //   },
      // },
      {
        $project: {
          __v: 0,
          geoLocation: 0,
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $skip: (pagination?.page - 1) * pagination?.size || 0,
      },
      {
        $limit: pagination?.size || 100,
      },
    ]);
    return results;
  }

  async deleteManyUser() {
    await this.userModel.deleteMany({ isFirstLogin: false });
  }

  async migrateData() {
    const users = await this.userModel.find();
    for (const user of users) {
      await user.save();
    }
  }
}

export const UserMongoRepoProvider = {
  provide: PROVIDER_REPO.USER + DATABASE_TYPE.MONGO,
  useClass: UserMongoRepo,
};
