import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { MongoID } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { User } from '@modules/users/entities';

@Schema({ timestamps: true })
export class PassesRequest implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: MongoID, ref: User.name })
  sender: User | string;

  @Prop({ type: MongoID, ref: User.name })
  receiver: User | string;

  createdAt?: Date;
  updatedAt?: Date;
}
export const PassesRequestSchema = SchemaFactory.createForClass(PassesRequest);
