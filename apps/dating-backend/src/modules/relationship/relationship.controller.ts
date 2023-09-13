import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { IResponse, IResult } from '@common/interfaces';
import { Relationship } from './entities';
import { PaginationDTO } from '@common/dto';
import { RelationshipType } from '@common/consts';

import { RelationshipService } from './relationship.service';
import { CreateRelationshipDTO, UpdateRelationshipDto } from './dto';

@ApiTags(Relationship.name)
@Controller('relationship')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  async create(@Body() relationshipDto: CreateRelationshipDTO) {
    return await this.relationshipService.create(relationshipDto);
  }

  @Get()
  @ApiQuery({ name: 'type', type: 'enum', enum: RelationshipType })
  async findAll(
    @Query() pagination: PaginationDTO,
    @Query() data,
  ): Promise<IResult<Relationship>> {
    const { type } = data;
    return await this.relationshipService.findAll(pagination, type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Relationship> {
    return await this.relationshipService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRelationshipDto: UpdateRelationshipDto,
  ): Promise<IResponse> {
    return this.relationshipService.update(id, updateRelationshipDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<IResponse> {
    return await this.relationshipService.remove(id);
  }
}
