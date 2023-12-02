import { ForbiddenException } from '@nestjs/common';
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

  @Prop({ default: [] })
  enableSafeMode: string[];

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  user: User;

  createdAt: Date;

  updatedAt: Date;

  static invalid(conversation: Conversation) {
    if (!conversation || conversation.isDeleted) {
      throw new ForbiddenException('ForbiddenException');
    }
  }

  static getReceiver(conversation: Conversation, userId: string, isPopulate?: boolean): User | string {
    if (!isPopulate) {
      return (conversation.members[0] as User)._id.toString() === userId
        ? (conversation.members[1] as User)
        : (conversation.members[0] as User);
    }
    return conversation.members[0] === userId ? conversation.members[1] : conversation.members[0];
  }

  static setReceiver(conversations: Conversation[], userId: string) {
    conversations.map(item => {
      item['user'] = Conversation.getReceiver(item, userId) as User;
      return item;
    });
  }
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
