import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { IEntity, MessageStatus, MessageType, MongoID } from '@dating/common';
import { Conversation } from '@modules/conversation/entities';
import { User, Image } from '@modules/users/entities';

@Schema({ timestamps: true })
export class Message implements IEntity {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop({ trim: true })
  text: string;

  @Prop({ type: MongoID, ref: User.name })
  sender: User | string;

  @Prop({ type: MongoID, ref: User.name })
  receiver: User | string;

  @Prop({ type: MongoID, ref: 'Conversation' })
  conversation: Conversation | string;

  @Prop({ type: String, trim: true, enum: Object.values(MessageType) })
  type: MessageType;

  @Prop({
    type: String,
    enum: Object.values(MessageStatus),
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Prop({ type: Date })
  seenAt: Date;

  @Prop([{ type: Image }])
  images: Image[];

  @Prop({ type: Number, max: 5, min: 1 })
  rating: number;

  @Prop()
  reviewMessage: string;

  @Prop({ type: String })
  uuid: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ default: new Date() })
  createdAt: Date;

  updatedAt: Date;
}
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversation: 1, status: 1 });
