import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';

import { Currency, LimitType, MerchandisingType, OfferingType, RefreshIntervalUnit } from '@common/consts';
import { IEntity } from '@common/interfaces';

@Schema()
export class Package {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop()
  amount?: number;

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

  @Prop({ default: false })
  isMilestones?: boolean;

  save: number;
}

@Schema({ _id: false })
export class MerchandisingItem {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: String, enum: MerchandisingType })
  name: MerchandisingType;

  @Prop({ type: String, enum: Object.values(LimitType) })
  type: LimitType;

  @Prop({ type: Number })
  amount: number;

  @Prop()
  iconUrl: string;

  @Prop()
  text: string;

  @Prop({ type: Number })
  refreshInterval: number;

  @Prop({ type: String, enum: Object.values(RefreshIntervalUnit) })
  refreshIntervalUnit: RefreshIntervalUnit;
}

@Schema({ _id: false })
export class Style {
  @Prop()
  buttonColor: string;

  @Prop()
  buttonBackground: string;

  @Prop()
  background: string;

  @Prop()
  primaryColor: string;

  @Prop()
  chartColor: string;
}

@Schema({ timestamps: true })
export class Offering implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ trim: true })
  iconUrl: string;

  @Prop({ trim: true })
  text: string;

  @Prop({ type: Style })
  style: Style;

  @Prop({
    type: String,
    enum: Object.values(OfferingType),
  })
  type: OfferingType;

  @Prop([{ type: Package }, { default: [] }])
  packages: Package[];

  @Prop([{ type: MerchandisingItem }, { default: [] }])
  merchandising: MerchandisingItem[];

  @Prop({ default: false })
  isRetail: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  static setSave(offering: Offering): void {
    const milestones = offering.packages.find(_package => _package.isMilestones);
    if (!milestones) {
      return;
    }
    offering.packages.map(_package => {
      if (!_package.isMilestones && _package.refreshIntervalUnit === RefreshIntervalUnit.MONTH) {
        const priceByWeek = milestones.price * (4 * _package.refreshInterval);
        const ratio = Number((_package.price / priceByWeek).toFixed(2)) * 100;
        _package.save = 100 - ratio;
      }
    });
  }
}

export const OfferingSchema = SchemaFactory.createForClass(Offering);
