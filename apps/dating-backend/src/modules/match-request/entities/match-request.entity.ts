import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { MatchRqStatus, MongoID } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { User } from '@modules/users/entities';

@Schema({ timestamps: true })
export class MatchRequest implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: MongoID, ref: User.name })
  sender: User | string;

  @Prop({ type: MongoID, ref: User.name })
  receiver: User | string;

  @Prop({ type: String, enum: Object.values(MatchRqStatus), default: MatchRqStatus.REQUESTED })
  status: MatchRqStatus;

  @Prop({ default: false })
  isBoosts: boolean;

  @Prop()
  expiredAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}
export const MatchRequestSchema = SchemaFactory.createForClass(MatchRequest);
MatchRequestSchema.index({ receiver: 1, sender: 1 });
