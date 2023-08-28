import { ApiProperty } from '@nestjs/swagger';
import { Report } from '../entities/report.entity';
export class CreateReportDto implements Partial<Report> {
  @ApiProperty()
  reason?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  userIsReported?: string;
}
