import {
  MerchandisingDTO,
  PackageDTO,
} from '@modules/offering/dto/create-offering.dto';
import { Billing } from '../entities/billing.entity';
import { BillingStatus } from '@common/consts';

export class CreateBillingDto implements Partial<Billing> {
  offering?: string;
  createdBy?: string;
  latestPackage?: PackageDTO;
  lastMerchandising?: MerchandisingDTO;
  expiredDate?: Date;
  status?: BillingStatus;
}
