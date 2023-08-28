import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { MongoID } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { User } from '@modules/users/entities/user.entity';

@Schema({ timestamps: true })
export class Report implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: MongoID, ref: User.name })
  userIsReported: User | string;

  @Prop({ type: MongoID, ref: User.name })
  reportBy: User | string;

  @Prop({ trim: true })
  reason: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt?: Date;
}
export const ReportSchema = SchemaFactory.createForClass(Report);
