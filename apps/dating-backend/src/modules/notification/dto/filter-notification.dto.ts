import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { NotificationStatus, NotificationType } from '@common/consts';
import { Notification } from '../entities';

export class FilterGetAllNotification implements Partial<Notification> {
  @ApiPropertyOptional({ type: NotificationStatus, enum: NotificationStatus })
  status?: NotificationStatus;

  @ApiPropertyOptional({ type: [String], enum: NotificationType })
  types?: NotificationType[];

  @ApiProperty({ type: Number, default: 1, required: false })
  @Type(() => Number)
  page?: number;

  @ApiProperty({ type: Number, default: 100, required: false })
  @IsOptional()
  size?: number;
}
