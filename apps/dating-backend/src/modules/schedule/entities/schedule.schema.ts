import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { MongoID, RequestDatingStatus } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { User } from '@modules/users/entities';
import { Conversation } from '@modules/conversation/entities';

@Schema({ _id: false })
export class LocationDating {
  @Prop()
  name: string;

  @Prop({ type: [Number] })
  geoLocation: number[];
}

@Schema({ timestamps: true })
export class Schedule implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: Object.values(RequestDatingStatus) })
  status: RequestDatingStatus;

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop([{ type: LocationDating, default: [] }])
  locationDating: LocationDating[];

  @Prop({ type: MongoID, ref: Conversation.name, required: true })
  conversation: Conversation | string;

  @Prop({ type: MongoID, ref: User.name })
  createdBy: User | string;

  @Prop({ type: MongoID, ref: User.name })
  updatedBy: User | string;

  @Prop({ default: false })
  isDeleted?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
