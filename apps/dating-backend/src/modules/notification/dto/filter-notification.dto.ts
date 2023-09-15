import { FilterGetAll } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Notification } from '../entities';
import { NotificationStatus } from '@common/consts';

export class FilterGetAllNotification extends FilterGetAll implements Partial<Notification> {
  @ApiPropertyOptional({ type: NotificationStatus, enum: NotificationStatus })
  status?: NotificationStatus;
}
