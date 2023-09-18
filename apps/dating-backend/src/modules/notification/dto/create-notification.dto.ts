import { User } from '@modules/users/entities';
import { Notification } from '../entities';
import { NotificationType } from '@common/consts';
import { Conversation } from '@modules/conversation/entities';
import { Message } from '@modules/message/entities';

export class CreateNotificationDto implements Partial<Notification> {
  sender?: User;
  receiver?: User;
  type?: NotificationType;
  description?: string;
  conversation?: Conversation;
  message?: Message;
}
