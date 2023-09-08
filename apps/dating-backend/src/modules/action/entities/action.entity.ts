import { MongoID } from '@common/consts';
import { User } from '@modules/users/entities/user.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

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
}
export const ActionSchema = SchemaFactory.createForClass(Action);
ActionSchema.index({ userId: 1, countLiked: 1, countUnLiked: 1 });
