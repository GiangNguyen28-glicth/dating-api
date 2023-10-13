import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { MongoID, RequestDatingStatus } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { User } from '@modules/users/entities';

@Schema({ _id: false })
export class LocationDating {
  @Prop()
  name: string;

  @Prop()
  link: string;

  @Prop({ type: [String] })
  images: string[];

  @Prop()
  address: string;

  @Prop()
  phoneNumber: string;
}

@Schema({ timestamps: true })
export class Schedule implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: Object.values(RequestDatingStatus), default: RequestDatingStatus.WAIT_FOR_APPROVAL })
  status: RequestDatingStatus;

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop([{ type: LocationDating, default: [] }])
  locationDating: LocationDating[];

  @Prop({ type: MongoID, ref: User.name })
  sender: User | string;

  @Prop({ type: MongoID, ref: User.name })
  receiver: User | string;

  @Prop({ type: MongoID, ref: User.name })
  updatedBy: User | string;

  @Prop({ type: [String], default: [] })
  excludedUsers: string[];

  @Prop({ default: true })
  isShowLocationDating: boolean;

  @Prop({ default: false })
  isDeleted?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
