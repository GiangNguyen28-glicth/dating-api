import { FilterGetAll } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Report } from '../entities/report.entity';
import { User } from '@modules/users/entities';
export class FilterGetAllReportDTO
  extends FilterGetAll
  implements Partial<Report>
{
  @ApiPropertyOptional()
  reportedUser?: User;

  @ApiPropertyOptional()
  reportBy?: User;
}
