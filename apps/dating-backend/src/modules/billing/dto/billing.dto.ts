import { FilterGetAll, FilterGetOne } from '@common/dto';
import { Billing } from '../entities';
import { BillingStatus } from '@common/index';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterGetOneBillingDTO
  extends FilterGetOne
  implements Partial<Billing> {}

export class FilterGetAllBillingDTO
  extends FilterGetAll
  implements Partial<Billing>
{
  @ApiPropertyOptional()
  expiredDate?: Date;

  @ApiPropertyOptional()
  status?: BillingStatus;
}
