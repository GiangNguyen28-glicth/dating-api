import { FilterGetAll } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Report } from '../entities/report.entity';
export class FilterGetAllReportDTO
  extends FilterGetAll
  implements Partial<Report>
{
  @ApiPropertyOptional()
  userIsReported?: string;

  @ApiPropertyOptional()
  reportBy?: string;
}
