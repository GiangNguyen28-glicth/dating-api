import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { LocationDating, Schedule } from '../entities';

export class LocationDatingDTO implements Partial<LocationDating> {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  address?: string;

  @ApiProperty()
  images?: string[];

  @ApiProperty()
  phoneNumber?: string;

  @ApiProperty()
  link?: string;
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

  @ApiProperty({ type: [LocationDatingDTO] })
  locationDating?: LocationDating[];
}

export class SuggestLocationDTO {
  @ApiProperty()
  @IsNotEmpty()
  prefix: string;
}
