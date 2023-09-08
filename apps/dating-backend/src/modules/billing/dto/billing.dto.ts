import { FilterGetAll, FilterGetOne } from '@common/dto';
import { Billing } from '../entities';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillingProcess, BillingStatus } from '@common/consts';

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

  @ApiPropertyOptional()
  process?: BillingProcess;
}
