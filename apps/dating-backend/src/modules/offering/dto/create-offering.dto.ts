import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

import { Currency, LimitType, MerchandisingType, OfferingType, RefreshIntervalUnit } from '@common/consts';

import { MerchandisingItem, Offering, Package } from '../entities';
import { FilterGetOne } from '@common/dto';
export class PackageDTO implements Package {
  price: number;
  save: number;

  @ApiProperty()
  effectiveTime?: number;

  @ApiProperty({
    type: 'enum',
    enum: RefreshIntervalUnit,
    default: RefreshIntervalUnit.MINUTES,
  })
  effectiveUnit?: RefreshIntervalUnit;

  @ApiProperty({ default: 300000 })
  @IsNumber()
  originalPrice: number;

  @ApiProperty({ default: 12 })
  @IsNumber()
  refreshInterval: number;

  @ApiProperty({
    type: 'enum',
    enum: RefreshIntervalUnit,
    default: RefreshIntervalUnit.MONTH,
  })
  refreshIntervalUnit: RefreshIntervalUnit;

  @ApiProperty({ type: 'enum', enum: Currency, default: Currency.VND })
  currency: Currency;

  @ApiProperty({ default: 50 })
  @IsNumber()
  discount: number;
}

export class MerchandisingItemDTO implements MerchandisingItem {
  @ApiProperty({ type: 'enum', enum: MerchandisingType })
  name: MerchandisingType;

  @ApiProperty({ type: 'enum', enum: LimitType, default: LimitType.UNLIMITED })
  type: LimitType;

  @ApiProperty()
  iconUrl: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ default: 12 })
  @IsNumber()
  amount: number;

  @ApiProperty({ default: 1 })
  @IsNumber()
  refreshInterval: number;

  @ApiProperty({
    type: 'enum',
    enum: RefreshIntervalUnit,
    default: RefreshIntervalUnit.MONTH,
  })
  @IsNumber()
  refreshIntervalUnit: RefreshIntervalUnit;
}
export class CreateOfferingDto implements Partial<Offering> {
  @ApiProperty()
  iconUrl?: string;

  @ApiProperty()
  text?: string;

  @ApiProperty()
  background?: string;

  @ApiProperty({ type: 'enum', enum: OfferingType })
  type?: OfferingType;

  @ApiProperty({ type: [PackageDTO] })
  packages?: Package[];

  @ApiProperty({ type: [MerchandisingItemDTO] })
  merchandising?: MerchandisingItem[];
}

export class FilterGetOneOfferingDTO extends FilterGetOne implements Partial<Offering> {
  type?: OfferingType;
  isRetail?: boolean;
}
