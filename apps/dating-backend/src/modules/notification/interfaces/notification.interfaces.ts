import { Notification } from '../entities';
export interface INotificationResult {
  messages?: Notification[];
  likes?: Notification[];
  matched?: Notification[];
}
