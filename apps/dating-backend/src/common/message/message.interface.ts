import { ImageDTO } from '@modules/users/dto';
import { BoostsSession, FeatureAccessItem, SpotifyInfo } from '@modules/users/entities';
import { Notification } from '@modules/notification/entities';
import { OfferingType } from '@common/consts';
//============= PAYMENT MESSAGE //=============
export interface IPaymentMessage {
  userId?: string;
  billingId?: string;
  featureAccess?: FeatureAccessItem[];
  boostsSession?: BoostsSession;
  offeringType?: OfferingType;
}

//============= USER MESSAGE //=============
export interface IUserImageBuilder {
  userId: string;
  images?: ImageDTO[];
  insImages?: ImageDTO[];
  spotifyInfo?: SpotifyInfo[];
  blurAvatar?: string;
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
