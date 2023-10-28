import { NotificationStatus, NotificationType } from '@common/consts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Notification } from '../entities';
import { Schedule } from '@modules/schedule/entities';
import { User } from '@modules/users/entities';

export class UpdateNotificationDto implements Partial<Notification> {
  @ApiPropertyOptional({ type: NotificationStatus, enum: NotificationStatus })
  status?: NotificationStatus;

  receiver?: string | User;
}

export class UpdateNotificationByUserDto {
  @ApiProperty({ type: [String], required: true })
  @IsNotEmpty()
  ids: string[];

  @ApiProperty({ type: UpdateNotificationDto })
  notification: UpdateNotificationDto;
}

export class DeleteManyNotification implements Partial<Notification> {
  @ApiProperty({ type: [String], required: true })
  @IsNotEmpty()
  ids?: string[];

  schedule?: Schedule | string;

  status?: NotificationStatus;

  type?: NotificationType;

  receiver?: string;
}
