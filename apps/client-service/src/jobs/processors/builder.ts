import { Injectable } from '@nestjs/common';

import { BillingProcess, DEFAULT_LIKES_REMAINING } from '@common/consts';

import { User } from '@modules/users/entities';
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
      } as any,
    };
    return updateMany;
  }

  buildUpdateManyUsersWhenBillingExpired(userIds: string[]): IUpdateMany<User> {
    const updateMany: IUpdateMany<User> = {
      ids: userIds,
      entities: {
        featureAccess: User.getDefaultFeatureAccess(),
      },
    };
    return updateMany;
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
