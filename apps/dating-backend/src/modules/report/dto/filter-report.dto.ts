import { FilterGetAll } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { Report } from '../entities';
export class FilterGetAllReportDTO extends FilterGetAll implements Partial<Report> {
  @ApiPropertyOptional()
  reportedUser?: string;

  @ApiPropertyOptional()
  reportBy?: string;
}
