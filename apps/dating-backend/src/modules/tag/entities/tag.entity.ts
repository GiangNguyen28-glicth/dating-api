import { IEntity, ParentTagType, TagRelationshipModeType, TagType } from '@dating/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

@Schema({ timestamps: true })
export class Tag implements IEntity {
  @Transform(({ value }) => value.toString())
  _id: string;

  @Prop({ trim: true })
  name: string;

  @Prop({ type: String, trim: true, enum: Object.values(TagType) })
  type: TagType;

  @Prop({ type: String, trim: true, enum: Object.values(ParentTagType) })
  parentType: ParentTagType;

  @Prop({
    type: String,
    enum: Object.values(TagRelationshipModeType),
    default: TagRelationshipModeType.ALL,
  })
  mode: TagRelationshipModeType;

  @Prop({ trim: true })
  icon: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ default: false })
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
