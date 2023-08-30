import { IResponse, IResult } from '@dating/common';
import { throwIfNotExists } from '@dating/utils';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { FilterGetAllTagDTO } from './dto/tag.dto';
import { UpdateTagDTO } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';
import { TagService } from './tag.service';

@ApiTags(Tag.name)
@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  findAll(@Query() filter: FilterGetAllTagDTO): Promise<IResult<Tag>> {
    return this.tagService.findAll(filter);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id') id: string) {
    return this.tagService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateTagDTO })
  async update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDTO,
  ): Promise<IResponse> {
    const tag = await this.tagService.findOneAndUpdate(id, updateTagDto);
    throwIfNotExists(tag, 'Không tìm thấy Tag');
    return {
      success: true,
      message: 'Cập nhật Tag thành công',
    };
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string' })
  async delete(@Param('id') id: string): Promise<IResponse> {
    const tag = await this.tagService.findOneAndUpdate(id, {
      isDeleted: true,
    } as UpdateTagDTO);
    throwIfNotExists(tag, 'Không tìm thấy Tag');
    return {
      success: true,
      message: 'Xóa Tag thành công',
    };
  }
}
