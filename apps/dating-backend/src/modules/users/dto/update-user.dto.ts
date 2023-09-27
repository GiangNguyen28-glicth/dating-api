import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

import { Gender, LookingFor, RelationshipModeType, TagType } from '@common/consts';
import { Tag } from '@modules/tag/entities';
import { Relationship } from '@modules/relationship/entities';

import { DiscoverySetting, HiddenProfile, HomeTown, Image, User, UserSetting } from '../entities';
export class ImageDTO implements Partial<Image> {
  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  blur?: string;
}

export class UpdateUserDiscoverySettingDTO implements DiscoverySetting {
  @ApiProperty()
  distance: number;

  @ApiProperty()
  maxAge: number;

  @ApiProperty()
  minAge: number;

  @ApiProperty()
  onlyShowAgeThisRange: boolean;

  @ApiProperty()
  onlyShowDistanceThisRange: boolean;

  @ApiProperty({ type: LookingFor, enum: LookingFor })
  lookingFor: LookingFor;

  @ApiProperty()
  recentlyActive: boolean;

  @ApiPropertyOptional({
    type: RelationshipModeType,
    enum: RelationshipModeType,
  })
  modeGoal: RelationshipModeType;
}

export class UpdateHiddenProfileDTO implements Partial<HiddenProfile> {
  @ApiPropertyOptional()
  weight?: boolean;

  @ApiPropertyOptional()
  height?: boolean;

  @ApiPropertyOptional()
  inFinder?: boolean;
}

export class UpdateUserSettingDTO implements Partial<UserSetting> {
  @ApiPropertyOptional()
  discovery?: UpdateUserDiscoverySettingDTO;

  @ApiPropertyOptional()
  hiddenProfile?: UpdateHiddenProfileDTO;

  @ApiPropertyOptional()
  stepStarted?: number;
}

export class UpdateHomeTownDTO implements Partial<HomeTown> {
  @ApiPropertyOptional()
  province: string;

  @ApiPropertyOptional()
  district: string;

  @ApiPropertyOptional()
  ward: string;
}

export class UpdateHiddenProfileField {
  @ApiPropertyOptional()
  value: number;

  @ApiPropertyOptional()
  isShowInFinder: boolean;
}

export class UpdateUserProfileDto implements Partial<User> {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  birthDate?: Date;

  @Transform(({ value }) =>
    value.map(image => {
      return { url: image };
    }),
  )
  @ApiPropertyOptional({ type: [ImageDTO] })
  images?: ImageDTO[];

  @ApiPropertyOptional()
  school?: string;

  @ApiPropertyOptional()
  company?: string;

  @ApiPropertyOptional()
  jobs?: string[];

  @ApiPropertyOptional()
  weightSetting?: UpdateHiddenProfileField;

  @ApiPropertyOptional()
  heightSetting?: UpdateHiddenProfileField;

  @ApiPropertyOptional()
  tags?: Tag[];

  @ApiPropertyOptional({ type: Gender, enum: Gender })
  gender?: Gender;

  @ApiPropertyOptional()
  relationship?: Relationship[];

  @ApiPropertyOptional({ type: 'string' })
  relationshipStatus?: Relationship;

  @ApiPropertyOptional()
  stepStarted?: number;

  @ApiPropertyOptional()
  homeTown?: UpdateHomeTownDTO;

  height?: number;
  weight?: number;
  setting?: UpdateUserSettingDTO;
}

export class UpdateUserLocationDTO {
  @ApiProperty()
  lat: number;

  @ApiProperty()
  long: number;
}

export class UpdateUserTagDTO {
  @ApiProperty()
  @IsNotEmpty()
  tagId: string;

  @ApiProperty({ type: 'enum', enum: TagType })
  @IsNotEmpty()
  tagType: TagType;
}
