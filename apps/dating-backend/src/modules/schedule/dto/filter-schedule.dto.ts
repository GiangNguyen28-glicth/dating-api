import { ApiPropertyOptional } from '@nestjs/swagger';
import { FilterGetAll } from '@common/dto';
import { RequestDatingStatus } from '@common/consts';
import { Schedule } from '../entities';

export class FilterGetAllScheduleDTO extends FilterGetAll implements Partial<Schedule> {
  @ApiPropertyOptional({ type: 'enum', enum: RequestDatingStatus })
  status?: RequestDatingStatus;

  @ApiPropertyOptional()
  appointmentDate?: Date;

  @ApiPropertyOptional()
  sender?: string;

  @ApiPropertyOptional()
  receiver?: string;

  userId?: string;

  @ApiPropertyOptional({ type: Date })
  fromDate?: Date;

  @ApiPropertyOptional({ type: Date })
  toDate?: Date;
}

export class FilterCountScheduleDTO implements Partial<Schedule> {
  @ApiPropertyOptional({ type: 'enum', enum: RequestDatingStatus })
  status?: RequestDatingStatus;

  userId?: string;
}
