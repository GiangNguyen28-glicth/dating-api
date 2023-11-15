import { Notification } from '@modules/notification/entities';
import { MerchandisingItem } from '@modules/offering/entities';
import { ImageDTO } from '@modules/users/dto';
import { BoostsSession, SpotifyInfo } from '@modules/users/entities';
//============= PAYMENT MESSAGE //=============
export interface IPaymentMessage {
  userId?: string;
  billingId?: string;
  featureAccess?: MerchandisingItem[];
  boostsSession?: BoostsSession;
  offeringType?: string;
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
