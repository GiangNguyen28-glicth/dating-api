import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

import { LocationDating, Schedule } from '../entities';
import { Conversation } from '@modules/conversation/entities';

export class LocationDatingDTO implements Partial<LocationDating> {
  @ApiProperty()
  name?: string;

  @ApiProperty({ type: [Number] })
  geoLocation?: number[];
}

export class CreateScheduleDTO implements Partial<Schedule> {
  @ApiProperty()
  @IsNotEmpty()
  appointmentDate?: Date;

  @ApiProperty()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: LocationDatingDTO })
  locationDating?: LocationDating[];

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  conversation?: string;
}

export class SuggestLocationDTO {
  @ApiProperty()
  @IsNotEmpty()
  content: string;
}
