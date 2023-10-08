import { ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDating, Schedule } from '../entities';
import { LocationDatingDTO } from './create-schedule.dto';

export class UpdateScheduleDTO implements Partial<Schedule> {
  @ApiPropertyOptional()
  appointmentDate?: Date;

  @ApiPropertyOptional({ type: LocationDatingDTO })
  locationDating?: LocationDating[];
}
