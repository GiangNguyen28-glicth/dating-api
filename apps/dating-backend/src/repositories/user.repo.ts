import {
  CrudRepo,
  DATABASE_TYPE,
  PROVIDER_REPO,
  UserModelType,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { User } from '@modules/users/entities';
import { UserHelper } from '@modules/users/helper/user.helper';
import { InjectModel } from '@nestjs/mongoose';
import { PipelineStage } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserRepo extends CrudRepo<User> {
  recommendation(filter: PipelineStage[]);
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

  async recommendation(finalCond: PipelineStage[]): Promise<User[]> {
    const results: User[] = await this.userModel.aggregate(finalCond);
    return results;
  }

  async deleteManyUser() {
    await this.userModel.deleteMany();
  }

  async migrateData() {
    const users = await this.userModel.find();
    for (const user of users) {
      // user.tags = [
      //   '64ee243aa7626b0485f03331',
      //   '64ee243aa7626b0485f03350',
      //   '64ee243aa7626b0485f0336b',
      //   '64ee243aa7626b0485f03345',
      //   '64ee243aa7626b0485f03325',
      // ];
      await user.save();
    }
  }
}

export const UserMongoRepoProvider = {
  provide: PROVIDER_REPO.USER + DATABASE_TYPE.MONGO,
  useClass: UserMongoRepo,
};
