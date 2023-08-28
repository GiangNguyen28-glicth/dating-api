import { FilterGetOne, RegisterType } from '@dating/common';
import { IsEmail, IsPhoneNumber } from 'class-validator';
import { User } from '../entities/user.entity';

export class CreateUserDTO implements Partial<User> {
  @IsEmail()
  email?: string;

  @IsPhoneNumber('VN')
  phoneNumber?: string;
}

export class FilterGetOneUserDTO extends FilterGetOne implements Partial<User> {
  _id?: string;
  email?: string;
  registerType?: RegisterType;
  phoneNumber?: string;
}

export class RecommendationDTO {
  likedUserIds: string[];
  unLikedUserIds: string[];
}
