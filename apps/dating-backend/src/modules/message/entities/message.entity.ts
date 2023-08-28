import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IEntity, MessageType, MongoID } from '@dating/common';
import { Transform } from 'class-transformer';
import { Conversation } from '@modules/conversation/entities/conversation.entity';
import { User } from '@modules/users/entities/user.entity';
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
  conversion: Conversation | string;

  @Prop({ type: String, trim: true, enum: Object.values(MessageType) })
  type: MessageType;

  @Prop({ trim: true, type: [String] })
  urlImages: string[];

  @Prop({ type: Number })
  cursor: number;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  createdAt: Date;

  updatedAt: Date;
}
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversion: 1, cursor: 1 });
