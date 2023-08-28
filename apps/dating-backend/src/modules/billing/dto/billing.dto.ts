import { FilterGetOne } from '@common/dto';
import { Billing } from '../entities/billing.entity';

export class FilterGetOneBillingDTO
  extends FilterGetOne
  implements Partial<Billing> {}
