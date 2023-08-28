import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TagType } from '@common/consts';
import { Tag } from '../entities/tag.entity';

export class CreateTagDTO implements Partial<Tag> {
  @ApiProperty()
  name?: string;

  @ApiProperty({ type: TagType, enum: TagType })
  type?: TagType;

  @ApiPropertyOptional({ type: TagType, enum: TagType })
  parentType?: TagType;

  @ApiProperty()
  description?: string;
}
