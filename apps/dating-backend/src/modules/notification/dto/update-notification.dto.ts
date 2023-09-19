import { NotificationStatus } from '@common/consts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Notification } from '../entities';

export class UpdateNotificationDto implements Partial<Notification> {
  @ApiPropertyOptional({ type: NotificationStatus, enum: NotificationStatus })
  status?: NotificationStatus;
}

export class UpdateNotificationByUserDto {
  @ApiProperty({ type: [String], required: true })
  @IsNotEmpty()
  ids: string[];

  @ApiProperty({ type: UpdateNotificationDto })
  notification: UpdateNotificationDto;
}

export class DeleteManyNotification {
  @ApiProperty({ type: [String], required: true })
  @IsNotEmpty()
  ids: string[];
}
