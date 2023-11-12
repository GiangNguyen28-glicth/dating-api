import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { BillingProcess, BillingStatus, MongoID, OfferingType } from '@common/consts';
import { IEntity } from '@common/interfaces';

import { MerchandisingItem, Offering, Package } from '@modules/offering/entities';
import { User } from '@modules/users/entities';
import { FormatBilling, TYPE_RANGE } from '@modules/admin/dto';

@Schema({ timestamps: true })
export class Billing implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: MongoID, ref: Offering.name })
  offering: Offering | string;

  @Prop({
    type: String,
    enum: Object.values(OfferingType),
  })
  offeringType: OfferingType;

  @Prop({ type: MongoID, ref: User.name })
  createdBy: User | string;

  @Prop({ type: Package })
  latestPackage: Package;

  @Prop([{ type: MerchandisingItem }])
  lastMerchandising: MerchandisingItem[];

  @Prop({ type: String, enum: Object.values(BillingStatus) })
  status: BillingStatus;

  @Prop({
    type: String,
    enum: Object.values(BillingProcess),
    default: BillingProcess.INPROGRESS,
  })
  process: BillingProcess;

  @Prop()
  expiredDate: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BillingSchema = SchemaFactory.createForClass(Billing);
