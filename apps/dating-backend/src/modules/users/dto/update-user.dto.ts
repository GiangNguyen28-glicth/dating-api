import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, LookingFor, RelationshipModeType } from '@common/consts';
import {
  DiscoverySetting,
  HomeTown,
  User,
  UserSetting,
} from '../entities/user.entity';
import { Tag } from '@modules/tag/entities/tag.entity';
import { Relationship } from '@modules/relationship/entities/relationship.entity';

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

export class UpdateUserSettingDTO implements Partial<UserSetting> {
  @ApiPropertyOptional()
  discovery?: UpdateUserDiscoverySettingDTO;

  @ApiPropertyOptional()
  stepStarted: number;
}

export class UpdateHomeTownDTO implements Partial<HomeTown> {
  @ApiPropertyOptional()
  province: string;

  @ApiPropertyOptional()
  district: string;

  @ApiPropertyOptional()
  ward: string;
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

  @ApiPropertyOptional()
  images?: string[];

  @ApiPropertyOptional()
  school?: string;

  @ApiPropertyOptional()
  company?: string;

  @ApiPropertyOptional()
  jobs?: string[];

  @ApiPropertyOptional()
  weight?: number;

  @ApiPropertyOptional()
  height?: number;

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
}

export class UpdateUserLocationDTO {
  @ApiProperty()
  lat: number;

  @ApiProperty()
  long: number;
}
