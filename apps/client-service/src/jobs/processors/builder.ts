import { Injectable } from '@nestjs/common';

import { DEFAULT_LIKES_REMAINING } from '@common/consts';

import { FeatureAccess, User } from '@modules/users/entities';
import { Billing } from '@modules/billing/entities';

import { IUpdateMany } from '../interfaces';

@Injectable()
export class BuilderService {
  buildUpdateManyUsersFT(userIds: string[]): IUpdateMany<User> {
    const updateMany: IUpdateMany<User> = {
      ids: userIds,
      entities: {
        'featureAccess.likes.amount': DEFAULT_LIKES_REMAINING,
        'featureAccess.likes.unlimited': false,
        'featureAccess.blur.unlimited': false,
      },
    };
    return updateMany;
  }

  buildUpdateFTByBilling(billing: Billing): any {
    const updateUser = {
      id: billing.createdBy,
    };
    return updateUser;
  }

  buildUpdateManyUsersWhenBillingExpired(users: User[]): IUpdateMany<User> {
    const userIds = users.map(user => user._id);
    const updateMany: IUpdateMany<User> = {
      ids: userIds,
      entities: {
        featureAccess: new FeatureAccess(),
      },
    };
    return updateMany;
  }
}
