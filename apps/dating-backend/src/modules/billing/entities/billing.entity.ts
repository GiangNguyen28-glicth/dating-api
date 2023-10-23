import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import { BillingProcess, BillingStatus, MongoID } from '@common/consts';
import { IEntity } from '@common/interfaces';
import { Merchandising, Offering, Package } from '@modules/offering/entities';
import { User } from '@modules/users/entities';

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
