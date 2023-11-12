import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { MongoID } from '@common/consts';
import { IEntity } from '@common/interfaces';

import { Image, User } from '@modules/users/entities';
import { Admin } from '@modules/admin/entities';

@Schema({ timestamps: true })
export class Report implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: MongoID, ref: User.name })
  reportedUser: User | string;

  @Prop({ type: MongoID, ref: User.name })
  reportBy: User | string;

  @Prop({ trim: true })
  reason: string;

  @Prop({ trim: true })
  description: string;

  @Prop([{ type: Image }])
  images: Image[];

  @Prop({ type: MongoID, ref: Admin.name })
  confirmBy: Admin | string;

  @Prop({ type: MongoID, ref: Admin.name })
  blockedBy: Admin | string;

  @Prop({ type: MongoID, ref: Admin.name })
  unBlockedBy: Admin | string;

  @Prop()
  blockAt: Date;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt?: Date;
}
export const ReportSchema = SchemaFactory.createForClass(Report);
