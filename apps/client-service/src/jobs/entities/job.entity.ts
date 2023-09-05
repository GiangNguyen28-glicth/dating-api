import { JobStatus } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { Model } from 'mongoose';

export type JobModelType = Model<Job>;
@Schema({ timestamps: true })
export class Job implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(JobStatus),
    default: JobStatus.TODO,
  })
  status: JobStatus;

  @Prop({ default: false })
  isDeleted?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
export const JobSchema = SchemaFactory.createForClass(Job);
