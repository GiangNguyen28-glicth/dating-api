import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { MongoID, NotificationStatus, NotificationType } from '@common/consts';
import { User } from '@modules/users/entities';
import { Conversation } from '@modules/conversation/entities';
import { Message } from '@modules/message/entities';
import { Schedule } from '@modules/schedule/entities';

@Schema({ timestamps: true })
export class Notification {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop()
  description: string;

  @Prop({ type: MongoID, ref: User.name })
  sender: User | string;

  @Prop({ type: MongoID, ref: User.name })
  receiver: User | string;

  @Prop({ type: MongoID, ref: Conversation.name })
  conversation: Conversation;

  @Prop({ type: MongoID, ref: Schedule.name })
  schedule: Schedule | string;

  @Prop({ type: MongoID, ref: Message.name, autopopulate: { maxDepth: 1 } })
  message: Message;

  @Prop({ type: String, enum: Object.values(NotificationType), required: true })
  type: NotificationType;

  @Prop({
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.NOT_RECEIVED,
  })
  status: NotificationStatus;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  createdAt: Date;

  updatedAt: Date;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ receiver: 1, status: 1 });
