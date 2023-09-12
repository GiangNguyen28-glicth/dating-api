import { User } from '@modules/users/entities';
import { Notification } from '../entities';
import { NotificationType } from '@common/consts';

export class CreateNotificationDto implements Partial<Notification> {
  sender?: User;
  receiver?: User;
  type?: NotificationType;
  description?: string;
}
