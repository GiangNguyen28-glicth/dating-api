import { FilterGetAll } from '@common/dto';
import { RequestDatingStatus } from '@common/consts';
import { Schedule } from '../entities';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterGetAllScheduleDTO extends FilterGetAll implements Partial<Schedule> {
  @ApiPropertyOptional({ type: 'enum', enum: RequestDatingStatus })
  status?: RequestDatingStatus;

  @ApiPropertyOptional()
  appointmentDate?: Date;

  @ApiPropertyOptional()
  userId?: string;
}
