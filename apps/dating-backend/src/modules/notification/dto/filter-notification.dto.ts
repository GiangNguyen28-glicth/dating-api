import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { NotificationStatus, NotificationType } from '@common/consts';
import { Notification } from '../entities';

export class FilterGetAllNotification implements Partial<Notification> {
  @ApiPropertyOptional({ type: NotificationStatus, enum: NotificationStatus })
  status?: NotificationStatus;

  @ApiPropertyOptional({ type: [NotificationType], enum: NotificationType })
  types?: NotificationType[];

  @ApiProperty({ type: Number, default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ type: Number, default: 100, required: false })
  @IsOptional()
  @Type(() => Number)
  size?: number;

  receiver?: string;

  schedule?: string;

  type?: NotificationType;

  ids?: string[];
}
