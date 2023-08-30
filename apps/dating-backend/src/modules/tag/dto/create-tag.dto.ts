import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ParentTagType,
  TagRelationshipModeType,
  TagType,
} from '@common/consts';
import { Tag } from '../entities/tag.entity';

export class CreateTagDTO implements Partial<Tag> {
  @ApiProperty()
  name?: string;

  @ApiProperty({ type: TagType, enum: TagType })
  type?: TagType;

  @ApiPropertyOptional({ type: ParentTagType, enum: ParentTagType })
  parentType?: ParentTagType;

  @ApiPropertyOptional({
    type: TagRelationshipModeType,
    enum: TagRelationshipModeType,
  })
  mode?: TagRelationshipModeType;

  @ApiProperty()
  description?: string;
}
