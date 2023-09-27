import { FilterGetAll, FilterGetOne, TagType } from '@dating/common';
import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '../entities/tag.entity';

export class FilterGetAllTagDTO extends FilterGetAll implements Partial<Tag> {
  @ApiProperty({ type: TagType, enum: TagType, required: false })
  type?: TagType;

  // @ApiProperty({ type: TagType, enum: TagType, required: false })
  // parentType?: TagType;
}

export class FilterGetOneTag extends FilterGetOne implements Partial<Tag> {
  type?: TagType;
}
