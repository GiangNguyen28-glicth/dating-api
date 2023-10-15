import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { LocationDating, Schedule } from '../entities';

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
