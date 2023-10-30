import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

import { Currency, LimitType, OfferingType, RefreshIntervalUnit } from '@common/consts';

import { Merchandising, MerchandisingItem, Offering, Package } from '../entities';
export class PackageDTO implements Package {
  price: number;
  save: number;

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

export class MerchandisingDTO implements Merchandising {
  @ApiProperty({ type: MerchandisingItemDTO })
  blur: MerchandisingItem;

  @ApiProperty({ type: MerchandisingItemDTO })
  hideAds: MerchandisingItem;

  @ApiProperty({ type: MerchandisingItemDTO })
  rewind: MerchandisingItem;

  @ApiProperty({ type: MerchandisingItemDTO })
  controlWhoSeesYou: MerchandisingItem;

  @ApiProperty({ type: MerchandisingItemDTO })
  controlWhoYouSee: MerchandisingItem;

  @ApiProperty({ type: MerchandisingItemDTO })
  likes: MerchandisingItem;

  @ApiProperty({ type: MerchandisingItemDTO })
  superLike: MerchandisingItem;
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

  @ApiProperty({ type: MerchandisingDTO })
  merchandising?: Merchandising;
}
