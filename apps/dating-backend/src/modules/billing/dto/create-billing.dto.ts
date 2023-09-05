import {
  MerchandisingDTO,
  PackageDTO,
} from '@modules/offering/dto/create-offering.dto';
import { Billing } from '../entities/billing.entity';
import { BillingStatus } from '@common/consts';
import { User } from '@modules/users/entities';

export class CreateBillingDto implements Partial<Billing> {
  offering?: string;
  createdBy?: User;
  latestPackage?: PackageDTO;
  lastMerchandising?: MerchandisingDTO;
  expiredDate?: Date;
  status?: BillingStatus;
}
