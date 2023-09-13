import { ImageDTO } from '@modules/users/dto';
import { FeatureAccess } from '@modules/users/entities';
import { Notification } from '@modules/notification/entities';
//============= PAYMENT MESSAGE //=============
export interface IPaymentMessage {
  userId: string;
  billingId: string;
  featureAccess: FeatureAccess;
}

//============= USER MESSAGE //=============
export interface IUserImageBuilder {
  userId: string;
  images: ImageDTO[];
}

//============= MESSENGER MESSAGE //=============
export interface IMessageImageBuilder {
  messageId: string;
  images: ImageDTO[];
}

//============= Notification MESSAGE //=============
export interface INotificationUpdater {
  notifications: Notification[];
}
