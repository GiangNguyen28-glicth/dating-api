import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

import { Currency, LimitType, MerchandisingType, OfferingType, RefreshIntervalUnit } from '@common/consts';

import { FilterGetAll, FilterGetOne } from '@common/dto';
import { MerchandisingItem, Offering, Package, Style } from '../entities';
export class PackageDTO implements Package {
  price: number;
  save: number;

  @IsNumber()
  @ApiPropertyOptional()
  amount?: number;

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

export class StyleDTO implements Partial<Style> {
  @ApiPropertyOptional()
  background?: string;

  @ApiPropertyOptional()
  buttonBackground?: string;

  @ApiPropertyOptional()
  buttonColor?: string;

  @ApiPropertyOptional()
  primaryColor?: string;
}

export class CreateOfferingDto implements Partial<Offering> {
  @ApiProperty()
  iconUrl?: string;

  @ApiProperty()
  text?: string;

  @ApiProperty({ type: 'enum', enum: OfferingType })
  type?: OfferingType;

  @ApiProperty({ type: [PackageDTO] })
  packages?: Package[];

  @ApiProperty({ type: [MerchandisingItemDTO] })
  merchandising?: MerchandisingItem[];

  @ApiPropertyOptional({ type: StyleDTO })
  style?: Style;

  @ApiPropertyOptional()
  isRetail?: boolean;

  createdBy?: string;
  updatedBy?: string;
}

export class FilterGetOneOfferingDTO extends FilterGetOne implements Partial<Offering> {
  type?: OfferingType;
  isRetail?: boolean;
}

export class FilterGetAllOffering extends FilterGetAll implements Partial<Offering> {
  @ApiPropertyOptional({ type: 'enum', enum: OfferingType })
  type?: OfferingType;

  @ApiPropertyOptional()
  isRetail?: boolean;
}
