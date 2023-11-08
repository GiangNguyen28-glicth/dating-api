import { ApiProperty } from '@nestjs/swagger';
import { Report } from '../entities/report.entity';
import { Image, User } from '@modules/users/entities';
import { ImageDTO } from '@modules/users/dto';
export class CreateReportDto implements Partial<Report> {
  @ApiProperty()
  reason?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty({ type: 'string' })
  reportedUser?: string;

  @ApiProperty({ type: [ImageDTO] })
  images?: Image[];
}
