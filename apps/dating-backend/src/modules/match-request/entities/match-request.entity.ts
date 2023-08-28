import { MongoID } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { User } from '@modules/users/entities/user.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

@Schema({ timestamps: true })
export class MatchRequest implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: MongoID, ref: User.name })
  owner: User | string;

  @Prop({ type: MongoID, ref: User.name })
  requestBy: User | string;

  @Prop({ default: false })
  isBoosts: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
export const MatchRequestSchema = SchemaFactory.createForClass(MatchRequest);
MatchRequestSchema.index({ owner: 1, requestBy: 1 });
