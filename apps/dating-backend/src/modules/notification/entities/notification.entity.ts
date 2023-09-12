import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { MongoID, NotificationStatus, NotificationType } from '@common/consts';
import { User } from '@modules/users/entities';
import { IEntity } from '@common/interfaces';

@Schema({ timestamps: true })
export class Notification implements IEntity {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ type: MongoID, ref: User.name })
  sender: User;

  @Prop({ type: MongoID, ref: User.name })
  receiver: User;

  @Prop({ type: String, enum: Object.values(NotificationType), required: true })
  type: NotificationType;

  @Prop({ type: String, enum: Object.values(NotificationStatus) })
  status: NotificationStatus;

  createdAt: Date;

  updatedAt: Date;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ receiver: 1, status: 1 });
