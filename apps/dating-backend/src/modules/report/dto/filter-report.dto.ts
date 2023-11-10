import { FilterGetAll } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { Report } from '../entities';
export class FilterGetAllReportDTO implements Partial<Report> {
  @ApiPropertyOptional()
  reportedUser?: string;

  @ApiPropertyOptional()
  reportBy?: string;

  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  size?: number;
}
