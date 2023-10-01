import { FilterGetAll, FilterGetOne, RegisterType } from '@dating/common';
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

export class FilterGetAllUserDTO extends FilterGetAll implements Partial<User> {
  _id?: string;
  email?: string;
  registerType?: RegisterType;
  phoneNumber?: string;
  lastActiveDate?: Date;
}

export class RecommendationDTO {
  likedUserIds: string[];
  unLikedUserIds: string[];
}

export const calField: Array<keyof User> = [
  'age',
  'bio',
  'birthDate',
  'company',
  'email',
  'gender',
  'height',
  'weight',
  'tags',
  'school',
  'homeTown',
  'jobs',
  'liveAt',
  'relationships',
  'relationshipStatus',
];
