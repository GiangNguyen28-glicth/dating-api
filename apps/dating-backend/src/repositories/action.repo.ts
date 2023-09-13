import { InjectModel } from '@nestjs/mongoose';
import {
  ActionModelType,
  CrudRepo,
  DATABASE_TYPE,
  MAX_COUNT_IN_ACTION_UPSERT,
  PROVIDER_REPO,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Action } from '@modules/action/entities';
import { User } from '@modules/users/entities';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ActionRepo extends CrudRepo<Action> {
  skip(user: User, skipUserId: string);
  rewind(user: User, rewindUserId: string);
  like(user: User, likeUserId: string);
}
export class ActionMongoRepo extends MongoRepo<Action> {
  constructor(
    @InjectModel(Action.name)
    protected actionModel: ActionModelType,
  ) {
    super(actionModel);
  }

  async skip(user: User, skipUserId: string) {
    return await this.actionModel.findOneAndUpdate(
      {
        userId: user._id.toString(),
        countUnLiked: { $lt: MAX_COUNT_IN_ACTION_UPSERT },
      },
      {
        $push: { unLikedUser: skipUserId },
        $inc: { countUnLiked: 1 },
        $set: { user: user._id },
      },
      { upsert: true },
    );
  }

  async like(user: User, likeUserId: string) {
    return await this.actionModel.findOneAndUpdate(
      {
        userId: user._id.toString(),
        countLiked: { $lt: MAX_COUNT_IN_ACTION_UPSERT },
      },
      {
        $push: { likedUser: likeUserId },
        $inc: { countLiked: 1 },
        $set: { user: user._id.toString() },
      },
      { upsert: true },
    );
  }

  async rewind(user: User, rewindUserId: string) {
    const action = await this.getRewindAction(user, rewindUserId);
    return await this.actionModel.findOneAndUpdate(
      { _id: action._id },
      {
        $pull: { unLikedUser: { $eq: rewindUserId } },
        $inc: { countUnLiked: -1 },
      },
    );
  }

  async getRewindAction(user: User, rewindUserId: string): Promise<Action> {
    const actions = await this.actionModel
      .find({
        userId: user._id.toString(),
      })
      .sort({ createdAt: 1 })
      .lean();
    for (const action of actions) {
      const indexOfRewindUserId = action.unLikedUser.indexOf(rewindUserId);
      if (indexOfRewindUserId != -1) {
        return actions[indexOfRewindUserId];
      }
    }
  }
}

export const ActionMongoRepoProvider = {
  provide: PROVIDER_REPO.ACTION + DATABASE_TYPE.MONGO,
  useClass: ActionMongoRepo,
};
