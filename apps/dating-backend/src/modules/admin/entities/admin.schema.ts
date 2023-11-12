import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { Model } from 'mongoose';

import { IEntity } from '@common/interfaces';
import { MongoID, Role } from '@common/consts';
export type AdminModelType = Model<Admin>;

@Schema({ timestamps: true })
export class Admin implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ trim: true, required: true })
  name: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  image: string;

  @Prop({ type: MongoID, ref: Admin.name })
  createdBy: Admin | string;

  @Prop({ type: MongoID, ref: Admin.name })
  confirmBy: Admin | string;

  @Prop({ type: String, enum: Object.values(Role) })
  role: Role;

  @Prop({ default: false })
  isDeleted?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
