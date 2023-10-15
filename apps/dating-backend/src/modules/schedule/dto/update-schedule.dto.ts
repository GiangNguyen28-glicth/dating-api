import { ApiPropertyOptional } from '@nestjs/swagger';
import { Schedule } from '../entities';

export class UpdateScheduleDTO implements Partial<Schedule> {
  @ApiPropertyOptional()
  appointmentDate?: Date;

  @ApiPropertyOptional({ type: [String] })
  locationDating?: string[];

  @ApiPropertyOptional()
  excludedUsers?: string[];

  @ApiPropertyOptional()
  isShowLocationDating?: boolean;
}
