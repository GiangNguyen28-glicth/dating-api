import { MerchandisingItemDTO, PackageDTO } from '@modules/offering/dto';
import { Billing } from '../entities/billing.entity';
import { BillingStatus, OfferingType } from '@common/consts';
import { User } from '@modules/users/entities';

export class CreateBillingDto implements Partial<Billing> {
  offering?: string;
  createdBy?: User;
  latestPackage?: PackageDTO;
  lastMerchandising?: MerchandisingItemDTO[];
  expiredDate?: Date;
  status?: BillingStatus;
  offeringType?: OfferingType;
}
