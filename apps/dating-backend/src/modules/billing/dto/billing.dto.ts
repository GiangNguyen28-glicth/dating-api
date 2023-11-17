import { BillingStatus } from '@common/consts';
import { FilterGetAll, FilterGetOne } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Billing } from '../entities';

export class FilterGetOneBillingDTO extends FilterGetOne implements Partial<Billing> {}

export class FilterGetAllBillingDTO extends FilterGetAll implements Partial<Billing> {
  @ApiPropertyOptional()
  expiredDate?: Date;

  @ApiPropertyOptional()
  status?: BillingStatus;

  fromDate?: string;
  toDate?: string;
}
