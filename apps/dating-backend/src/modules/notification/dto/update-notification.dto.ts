import { ApiBody, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Notification } from '../entities';
import { NotificationStatus } from '@common/consts';
import { IsNotEmpty } from 'class-validator';
import { User } from '@modules/users/entities';

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
