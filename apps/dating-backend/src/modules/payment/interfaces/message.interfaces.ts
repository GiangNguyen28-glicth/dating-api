import { FeatureAccess } from '@modules/users/entities';

export interface IPaymentMessage {
  userId: string;
  billingId: string;
  featureAccess: FeatureAccess;
}
