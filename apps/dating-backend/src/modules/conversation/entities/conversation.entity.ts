import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { IEntity, MongoID } from '@dating/common';
import { User } from '@modules/users/entities/user.entity';
import { Message } from '@modules/message/entities/message.entity';

@Schema({ timestamps: true })
export class Conversation implements IEntity {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop({ type: MongoID, ref: Message.name })
  lastMessage: Message | string;

  @Prop({ type: MongoID, ref: Message.name })
  messagePin: Message | string;

  @Prop({ type: [MongoID], ref: User.name })
  members: User[] | string[];

  @Prop({ type: MongoID, ref: User.name })
  user: User;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  createdAt: Date;

  updatedAt: Date;
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
