import { FilterGetAll } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Notification } from '../entities';
import { NotificationStatus, NotificationType } from '@common/consts';

export class FilterGetAllNotification extends FilterGetAll implements Partial<Notification> {
  @ApiPropertyOptional({ type: NotificationStatus, enum: NotificationStatus })
  status?: NotificationStatus;

  @ApiPropertyOptional({ type: NotificationType, enum: NotificationType })
  type?: NotificationType;
}
