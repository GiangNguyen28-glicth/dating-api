import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { LocationDating, Review, ReviewDetail, Schedule } from '../entities';
import { DatingStatus } from '@common/consts';

export class LocationDatingDTO implements Partial<LocationDating> {
  @ApiPropertyOptional()
  place_id?: string;
}

export class CreateScheduleDTO implements Partial<Schedule> {
  @ApiProperty()
  @IsNotEmpty()
  appointmentDate?: Date;

  @ApiProperty()
  name?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  receiver?: string;

  @ApiProperty({ type: [String] })
  locationDating?: string[];

  @ApiPropertyOptional()
  isShowLocationDating?: boolean;
}

export class SuggestLocationDTO {
  @ApiProperty()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsNotEmpty()
  location: string;
}

export class ReviewDetailDTO implements Partial<ReviewDetail> {
  @ApiProperty()
  question?: string;

  @ApiProperty()
  answer?: string;
}

export class ReviewDatingDTO implements Partial<Review> {
  @ApiProperty()
  createdAt?: Date;

  createdBy: string;

  @ApiProperty({ type: [ReviewDetailDTO] })
  detail?: ReviewDetail[];

  @ApiProperty()
  @IsNotEmpty()
  isJoin: boolean;

  @ApiProperty({ type: 'enum', enum: DatingStatus })
  datingStatus?: DatingStatus;
}
