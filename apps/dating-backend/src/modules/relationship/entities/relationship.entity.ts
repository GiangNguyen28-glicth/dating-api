import { RelationshipModeType, RelationshipType } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

@Schema({ timestamps: true })
export class Relationship implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ required: true })
  iconUrl: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: Object.values(RelationshipType), required: true })
  type: RelationshipType;

  @Prop({ type: String, enum: Object.values(RelationshipModeType) })
  mode: RelationshipModeType;

  @Prop({ default: false })
  isDeleted?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
export const RelationshipSchema = SchemaFactory.createForClass(Relationship);
