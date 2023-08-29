import { BillingStatus, MongoID } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Merchandising,
  MerchandisingItem,
  Offering,
  Package,
} from '@modules/offering/entities/offering.entity';
import { User } from '@modules/users/entities/user.entity';
import { Transform } from 'class-transformer';

@Schema({ timestamps: true })
export class Billing implements IEntity {
  @Transform(({ value }) => value.toString())
  _id?: string;

  @Prop({ type: MongoID, ref: Offering.name })
  offering: Offering | string;

  @Prop({ type: MongoID, ref: User.name })
  createdBy: User | string;

  @Prop({ type: Package })
  latestPackage: Package;

  @Prop({ type: Merchandising })
  lastMerchandising: Merchandising;

  @Prop({ type: String, enum: Object.values(BillingStatus) })
  status: BillingStatus;

  @Prop()
  expiredDate: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BillingSchema = SchemaFactory.createForClass(Billing);
