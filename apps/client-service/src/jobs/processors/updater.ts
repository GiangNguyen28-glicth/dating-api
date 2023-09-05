import { UserService } from '@modules/users';
import { Injectable } from '@nestjs/common';
import { IUpdateMany } from '../interfaces';
import { User } from '@modules/users/entities';

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
