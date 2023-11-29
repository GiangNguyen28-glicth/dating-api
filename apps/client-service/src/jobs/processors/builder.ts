import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';

import { IBulkWrite, LimitType, MerchandisingType, TIME_ZONE } from '@common/consts';

import { Billing } from '@modules/billing/entities';
import { MerchandisingItem } from '@modules/offering/entities';
import { FeatureAccessItem, User } from '@modules/users/entities';

@Injectable()
export class BuilderService {
  buildUpdateUserDefaultFeatureAccess(users: User[]): IBulkWrite[] {
    const isDefaultUpdate = (listing: FeatureAccessItem[]): boolean => {
      for (const item of listing) {
        if (item.name === MerchandisingType.SUPER_LIKE && item.amount > 1) {
          return false;
        }
      }
      return true;
    };

    const mapping = (defaultAccess: FeatureAccessItem[], listing: FeatureAccessItem[]): FeatureAccessItem[] => {
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
            update: {
              $set: {
                featureAccess: mapping(User.getDefaultFeatureAccess(), user.featureAccess),
                'boostsSession.expiredDate': new Date(),
              },
            },
          },
        });
      }
    }
    const updateDefault: IBulkWrite = {
      updateMany: {
        filter: { _id: { $in: bulkWriteDefault } },
        update: { $set: { featureAccess: User.getDefaultFeatureAccess(), 'boostsSession.expiredDate': new Date() } },
      },
    };
    return [updateDefault].concat(updateOneList);
  }

  buildRefreshFeatureAccess(billings: Billing[]): { bulkUser: IBulkWrite[]; bulkBilling: IBulkWrite[] } {
    const updateOneUserList: IBulkWrite[] = [];
    const updateOneBillingList: IBulkWrite[] = [];
    for (const bill of billings) {
      const arrayFilters = [];
      const updatedUser: IBulkWrite = {
        updateOne: {
          filter: { _id: bill.createdBy },
        },
      };
      const updatedBilling: IBulkWrite = {
        updateOne: {
          filter: { _id: bill._id },
        },
      };
      const $inc = {};
      for (const [index, merchandising] of bill.lastMerchandising.entries()) {
        if (merchandising.type != LimitType.UNLIMITED && MerchandisingItem.isRefreshDate(merchandising)) {
          if (merchandising.name != MerchandisingType.BOOSTS) {
            const ftFilter = {};
            $inc[`featureAccess.$[element${index}].amount`] = merchandising.amount;
            bill.lastMerchandising[index].refreshDate = moment().tz(TIME_ZONE).startOf('date').toDate();
            ftFilter[`element${index}.name`] = merchandising.name;
            arrayFilters.push(ftFilter);
          } else {
            $inc['boostsSession.amount'] = merchandising.amount;
          }
        }
      }
      updatedBilling.updateOne.update = {
        $set: { lastMerchandising: bill.lastMerchandising },
      };
      updatedUser.updateOne.update = {
        $inc,
      };
      if (arrayFilters.length) {
        updatedUser.updateOne.arrayFilters = arrayFilters;
      }
      updateOneUserList.push(updatedUser);
      updateOneBillingList.push(updatedBilling);
    }
    return {
      bulkBilling: updateOneBillingList,
      bulkUser: updateOneUserList,
    };
  }
}
