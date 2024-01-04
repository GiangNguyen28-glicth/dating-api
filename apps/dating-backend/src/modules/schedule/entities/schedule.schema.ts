import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { CreatedDatingType, DatingStatus, MongoID, RequestDatingStatus, ReviewDatingStatus } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { User } from '@modules/users/entities';

export class LocationDating {
  name: string;

  url: string;

  image: string;

  address: string;

  phoneNumber: string;

  place_id: string;

  website?: string;

  rating?: number;

  userRatingsTotal?: number;

  price_level: number;

  geoLocation?: number[];

  isEmpty?: boolean;

  reviews: any;
}

@Schema({ _id: false })
export class ReviewDetail {
  @Prop({ trim: true })
  question: string;

  @Prop({ trim: true })
  answer: string;
}

@Schema({ _id: false })
export class Review {
  @Prop()
  createdBy: string;

  @Prop([{ type: ReviewDetail, default: [] }])
  detail?: ReviewDetail[];

  @Prop({ type: Date, default: new Date() })
  createdAt?: Date;

  @Prop({ default: true })
  isJoin: boolean;

  @Prop({ type: String, enum: DatingStatus })
  datingStatus?: DatingStatus;
}

@Schema({ timestamps: true })
export class Schedule implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: Object.values(RequestDatingStatus), default: RequestDatingStatus.WAIT_FOR_APPROVAL })
  status: RequestDatingStatus;

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop({ type: String, enum: Object.values(CreatedDatingType), default: CreatedDatingType.MANUAL })
  createdType: CreatedDatingType;

  @Prop({ type: [String], default: [] })
  locationDating: string[];

  @Prop({ type: MongoID, ref: User.name })
  sender: User | string;

  @Prop({ type: MongoID, ref: User.name })
  receiver: User | string;

  @Prop({ type: String, enum: Object.values(ReviewDatingStatus), default: ReviewDatingStatus.WAIT_FOR_REVIEW })
  reviewDatingStatus: ReviewDatingStatus;

  @Prop({ type: MongoID, ref: User.name })
  updatedBy: User | string;

  @Prop([{ type: Review, default: [] }])
  reviews: Review[];

  @Prop({ default: true })
  isShowLocationDating: boolean;

  @Prop({ default: false })
  isSendMailReview?: boolean;

  @Prop({ default: false })
  isDeleted?: boolean;

  static getReviewDatingStatusDating(reviews: Review[]): ReviewDatingStatus {
    if (reviews.length < 2) {
      return ReviewDatingStatus.WAIT_FOR_REVIEW;
    }
    for (const review of reviews) {
      if (!review.isJoin) {
        return ReviewDatingStatus.NOT_JOINING;
      }
      if (review.datingStatus === DatingStatus.NO) {
        return ReviewDatingStatus.FAILED;
      }
      if (review.datingStatus === DatingStatus.HALFWAY) {
        return ReviewDatingStatus.HALFWAY;
      }
    }
    return ReviewDatingStatus.SUCCESS;
  }

  createdAt?: Date;
  updatedAt?: Date;
}
export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
