import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { IResponse, IResult } from '@common/interfaces';
import { PaginationDTO } from '@common/dto';
import { RelationshipType, Role } from '@common/consts';
import { AtGuard, RolesGuard } from '@common/guards';
import { CurrentUser, hasRoles } from '@common/decorators';

import { Admin } from '@modules/admin/entities';

import { Relationship } from './entities';
import { RelationshipService } from './relationship.service';
import { CreateRelationshipDTO, UpdateRelationshipDto } from './dto';

@ApiTags(Relationship.name)
@Controller('relationship')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  @UseGuards(AtGuard, RolesGuard)
  @hasRoles(Role.MASTER)
  async create(@Body() relationshipDto: CreateRelationshipDTO, @CurrentUser() admin: Admin) {
    relationshipDto.createdBy = admin._id;
    return await this.relationshipService.create(relationshipDto);
  }

  @Get()
  @ApiQuery({ name: 'type', type: 'enum', enum: RelationshipType })
  async findAll(@Query() pagination: PaginationDTO, @Query() data): Promise<IResult<Relationship>> {
    const { type } = data;
    return await this.relationshipService.findAll(pagination, type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Relationship> {
    return await this.relationshipService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AtGuard, RolesGuard)
  @hasRoles(Role.MASTER)
  async update(
    @Param('id') id: string,
    @Body() updateRelationshipDto: UpdateRelationshipDto,
    @CurrentUser() admin: Admin,
  ): Promise<IResponse> {
    updateRelationshipDto.updatedBy = admin._id;
    return this.relationshipService.update(id, updateRelationshipDto);
  }

  @Delete(':id')
  @UseGuards(AtGuard, RolesGuard)
  @hasRoles(Role.MASTER)
  async remove(@Param('id') id: string): Promise<IResponse> {
    return await this.relationshipService.remove(id);
  }
}
