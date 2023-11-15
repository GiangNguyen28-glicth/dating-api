import { Injectable } from '@nestjs/common';

import { BillingProcess, IBulkWrite, MerchandisingType } from '@common/consts';

import { Billing } from '@modules/billing/entities';
import { User } from '@modules/users/entities';
import { MerchandisingItem } from '@modules/offering/entities';

import { IUpdateMany } from '../interfaces';

@Injectable()
export class BuilderService {
  buildUpdateManyUsersFT(users: User[]): IBulkWrite[] {
    const isDefaultUpdate = (listing: MerchandisingItem[]): boolean => {
      for (const item of listing) {
        if (item.name === MerchandisingType.SUPER_LIKE && item.amount > 1) {
          return false;
        }
        if (item.name === MerchandisingType.BOOSTS && item.amount > 0) {
          return false;
        }
      }
      return true;
    };

    const mapping = (defaultAccess: MerchandisingItem[], listing: MerchandisingItem[]): MerchandisingItem[] => {
      const indexSuperLike = defaultAccess.findIndex(item => item.name === MerchandisingType.SUPER_LIKE);
      const indexBoosts = defaultAccess.findIndex(item => item.name === MerchandisingType.BOOSTS);
      for (const item of listing) {
        if (item.name === MerchandisingType.SUPER_LIKE) {
          defaultAccess[indexSuperLike].amount = item.amount;
        }
        if (item.name === MerchandisingType.BOOSTS) {
          defaultAccess[indexBoosts].amount = item.amount;
        }
      }
      return defaultAccess;
    };
    const bulkWriteDefault: string[] = [];
    const updateOneList: IBulkWrite[] = [];
    for (const user of users) {
      if (isDefaultUpdate(user.featureAccess)) {
        bulkWriteDefault.push(user._id);
      } else {
        updateOneList.push({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: { featureAccess: mapping(User.getDefaultFeatureAccess(), user.featureAccess) } },
          },
        });
      }
    }
    const updateDefault: IBulkWrite = {
      updateMany: {
        filter: { _id: { $in: bulkWriteDefault } },
        update: { $set: { featureAccess: User.getDefaultFeatureAccess() } },
      },
    };
    return [updateDefault].concat(updateOneList);
  }

  buildUpdateBillingExpired(billings: Billing[]): IUpdateMany<Billing> {
    const updateMany: IUpdateMany<Billing> = {
      ids: billings.map(billing => billing._id),
      entities: {
        process: BillingProcess.EXPIRED,
      },
    };
    return updateMany;
  }
}
