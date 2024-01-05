import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { MongoID, NotificationStatus, NotificationType } from '@common/consts';
import { Conversation } from '@modules/conversation/entities';
import { Message } from '@modules/message/entities';
import { Schedule } from '@modules/schedule/entities';
import { User } from '@modules/users/entities';
import { FilterGetAllNotification } from '../dto';
import { isString } from 'lodash';

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

  @Prop({ type: MongoID, ref: Message.name })
  message: Message | string;

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

  static getFilter(types: NotificationType[]): NotificationType[] {
    if (!types) {
      return null;
    }
    if (isString(types)) {
      types = [types as NotificationType];
    }
    console.log(types);
    if (types?.includes(NotificationType.SCHEDULE_DATING)) {
      const scheduleTypes = [
        NotificationType.ACCEPT_SCHEDULE_DATING,
        NotificationType.CANCEL_SCHEDULE_DATING,
        NotificationType.INVITE_SCHEDULE_DATING,
        NotificationType.DECLINE_SCHEDULE_DATING,
        NotificationType.POSITIVE_REVIEW_DATING,
      ];
      types.push(...scheduleTypes);
    }
    return types.filter(type => type != NotificationType.SCHEDULE_DATING);
  }

  createdAt: Date;

  updatedAt: Date;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ receiver: 1, status: 1 });
