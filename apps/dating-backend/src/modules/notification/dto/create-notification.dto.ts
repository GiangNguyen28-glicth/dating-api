import { User } from '@modules/users/entities';
import { Notification } from '../entities';
import { NotificationStatus, NotificationType } from '@common/consts';
import { Conversation } from '@modules/conversation/entities';
import { Message } from '@modules/message/entities';
import { Schedule } from '@modules/schedule/entities';

export class CreateNotificationDto implements Partial<Notification> {
  sender?: User | string;
  receiver?: User | string;
  type?: NotificationType;
  description?: string;
  conversation?: Conversation;
  message?: Message;
  schedule?: Schedule;
  status?: NotificationStatus;
}
