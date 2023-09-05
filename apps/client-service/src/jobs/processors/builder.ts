import { Injectable } from '@nestjs/common';
import { User } from '@modules/users/entities';
import { DEFAULT_LIKES_REMAINING } from '@common/index';
import { IUpdateMany } from '../interfaces';

@Injectable()
export class BuilderService {
  buildUpdateManyUsersFT(users: User[]): IUpdateMany<User> {
    const userIds = users.map(user => user._id);
    const updateMany: IUpdateMany<User> = {
      ids: userIds,
      entities: {
        'featureAccess.likes.amount': DEFAULT_LIKES_REMAINING,
      },
    };
    return updateMany;
  }
}
