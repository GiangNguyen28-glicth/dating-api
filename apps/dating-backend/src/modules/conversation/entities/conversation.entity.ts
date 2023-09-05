import { ConversationModelType, IEntity, MongoID } from '@dating/common';
import { Message } from '@modules/message/entities/message.entity';
import { User } from '@modules/users/entities/user.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

export type ConversationDocument = Conversation & Document;
@Schema({ timestamps: true })
export class Conversation implements IEntity {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop({ type: MongoID, ref: Message.name, autopopulate: { maxDepth: 1 } })
  lastMessage: Message;

  @Prop({ type: MongoID, ref: Message.name, autopopulate: { maxDepth: 1 } })
  messagePin: Message | string;

  @Prop({ type: [MongoID], ref: User.name })
  members: User[];

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  user: User;

  createdAt: Date;

  updatedAt: Date;
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
// ConversationSchema.virtual('user').get(function (this: ConversationDocument) {
//   return this.user;
// });
