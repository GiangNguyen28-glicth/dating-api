import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { ConversationType, IEntity, MongoID } from '@dating/common';

import { Message } from '@modules/message/entities';
import { User } from '@modules/users/entities';

@Schema({ timestamps: true })
export class Conversation implements IEntity {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop({ type: MongoID, ref: Message.name, autopopulate: { maxDepth: 1 } })
  lastMessage: Message;

  @Prop({ type: MongoID, ref: Message.name })
  messagePin: Message;

  @Prop({ type: [MongoID], ref: User.name })
  members: (User | string)[];

  @Prop({ type: String, enum: Object.values(ConversationType), default: ConversationType.MATCHED })
  type: ConversationType;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  user: User;

  createdAt: Date;

  updatedAt: Date;
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
