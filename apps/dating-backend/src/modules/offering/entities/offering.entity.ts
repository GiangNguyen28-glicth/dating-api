import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { Currency, LimitType, OfferingType, RefreshIntervalUnit } from '@common/consts';
import { IEntity } from '@common/interfaces';

@Schema({ _id: false })
export class MerchandisingItem {
  @Prop({ type: String, enum: Object.values(LimitType) })
  type: LimitType;

  @Prop({ type: Number })
  amount: number;

  @Prop()
  iconUrl: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: Number })
  refreshInterval: number;

  @Prop({ type: String, enum: Object.values(RefreshIntervalUnit) })
  refreshIntervalUnit: RefreshIntervalUnit;
}

@Schema({ _id: false })
export class Merchandising {
  @Prop({ type: MerchandisingItem })
  blur: MerchandisingItem;

  @Prop({ type: MerchandisingItem })
  hideAds: MerchandisingItem;

  @Prop({ type: MerchandisingItem })
  likes: MerchandisingItem;

  @Prop({ type: MerchandisingItem })
  rewind: MerchandisingItem;

  @Prop({ type: MerchandisingItem })
  superLike: MerchandisingItem;

  @Prop({ type: MerchandisingItem })
  controlWhoSeesYou: MerchandisingItem;

  @Prop({ type: MerchandisingItem })
  controlWhoYouSee: MerchandisingItem;
}

@Schema()
export class Package {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number })
  originalPrice: number;

  @Prop({ type: Number, default: 1 })
  refreshInterval: number;

  @Prop({ type: String, enum: Object.values(RefreshIntervalUnit) })
  refreshIntervalUnit: RefreshIntervalUnit;

  @Prop({ type: String, enum: Object.values(Currency) })
  currency: Currency;

  @Prop({ type: Number })
  discount: number;

  @Prop({ type: Number })
  save: number;
}

@Schema({ timestamps: true })
export class Offering implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ trim: true })
  iconUrl: string;

  @Prop({ trim: true, required: true })
  text: string;

  @Prop({ trim: true })
  background: string;

  @Prop({ trim: true })
  primaryColor: string;

  @Prop({
    type: String,
    enum: Object.values(OfferingType),
  })
  type: OfferingType;

  @Prop([{ type: Package, default: [] }])
  packages: Package[];

  @Prop({ type: Merchandising })
  merchandising: Merchandising;

  @Prop({ default: false })
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const OfferingSchema = SchemaFactory.createForClass(Offering);
