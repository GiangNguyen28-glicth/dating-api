import { ApiProperty } from '@nestjs/swagger';
import { Report } from '../entities/report.entity';
import { User } from '@modules/users/entities';
export class CreateReportDto implements Partial<Report> {
  @ApiProperty()
  reason?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  reportedUser?: User;
}
