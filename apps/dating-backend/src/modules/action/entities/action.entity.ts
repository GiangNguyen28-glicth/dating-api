import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { get } from 'lodash';

import { LimitType, MongoID } from '@common/consts';

import { MatchRequest } from '@modules/match-request/entities';
import { FeatureAccessItem, User } from '@modules/users/entities';
import { MerchandisingItem } from '@modules/offering/entities';

@Schema({ timestamps: true })
export class Action {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: MongoID, ref: User.name })
  userId: string;

  @Prop({ type: Number, default: 0 })
  countUnLiked: number;

  @Prop({ type: [MongoID], default: [] })
  unLikedUser: string[];

  @Prop({ type: Number, default: 0 })
  countLiked: number;

  @Prop({ type: [MongoID], default: [] })
  likedUser: string[];

  createdAt?: Date;

  updatedAt?: Date;

  static isByPassAction(featureAccess: FeatureAccessItem): boolean {
    if (!featureAccess.unlimited && featureAccess.amount < 1) {
      return false;
    }
    return true;
  }

  static isDuplicateAction(matchRq: MatchRequest, sender: User): boolean {
    if (!matchRq) {
      return false;
    }
    if (get(matchRq, 'sender', null) == sender._id.toString()) {
      return true;
    }
    return false;
  }
}
export const ActionSchema = SchemaFactory.createForClass(Action);
ActionSchema.index({ userId: 1, countLiked: 1, countUnLiked: 1 });
