import { UserService } from '@modules/users';
import { Injectable } from '@nestjs/common';

import { User } from '@modules/users/entities';

import { IUpdateMany } from '../interfaces';

@Injectable()
export class UpdaterService {
  constructor(private userService: UserService) {}

  async updateUserFT(updateMany: IUpdateMany<User>) {
    try {
      const { ids, entities } = updateMany;
      await this.userService.updateMany(ids, entities);
    } catch (error) {
      throw error;
    }
  }
}
