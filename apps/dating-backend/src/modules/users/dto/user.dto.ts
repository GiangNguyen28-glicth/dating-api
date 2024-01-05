import { FilterGetAll, FilterGetOne, Gender, PaginationDTO, RegisterType } from '@dating/common';
import { IsEmail, IsPhoneNumber } from 'class-validator';
import { User } from '../entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  isDeleted?: boolean;
}

export class FilterGetAllUserDTO extends PaginationDTO implements Partial<User> {
  _id?: string;
  email?: string;
  registerType?: RegisterType;
  phoneNumber?: string;
  lastActiveDate?: Date;

  @ApiPropertyOptional()
  isBlocked?: boolean;

  @ApiPropertyOptional({ type: 'enum', enum: Gender })
  gender?: Gender;

  @ApiProperty({ type: [String], required: false })
  ids?: string[];

  @ApiPropertyOptional()
  name?: string;

  @ApiProperty()
  isDeleted?: boolean;

  @ApiProperty()
  createdAt?: any;

  @ApiProperty()
  keyword?: string;
}

export class RecommendationDTO {
  likedUserIds: string[];
  unLikedUserIds: string[];
}

export class ImageProcessOptionsDTO {
  @ApiPropertyOptional()
  blur?: boolean;

  @ApiPropertyOptional()
  nsfw?: boolean;
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
