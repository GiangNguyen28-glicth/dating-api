import { BillingStatus } from '@common/consts';
import { PackageDTO } from '@modules/offering/dto';
import { MerchandisingItem } from '@modules/offering/entities';
import { User } from '@modules/users/entities';

import { Billing } from '../entities';

export class CreateBillingDto implements Partial<Billing> {
  offering?: string;
  createdBy?: User;
  latestPackage?: PackageDTO;
  lastMerchandising?: MerchandisingItem[];
  expiredDate?: Date;
  status?: BillingStatus;
  offeringType?: string;
  isRetail?: boolean;
}
