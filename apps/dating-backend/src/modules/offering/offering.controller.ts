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
import { ApiTags } from '@nestjs/swagger';

import { IResponse, IResult } from '@common/interfaces';
import { PaginationDTO } from '@common/dto';

import { OfferingService } from './offering.service';
import { Offering } from './entities';
import { CreateOfferingDto, UpdateOfferingDto } from './dto';

@ApiTags(Offering.name)
@Controller('offering')
export class OfferingController {
  constructor(private readonly offeringService: OfferingService) {}

  @Post()
  async create(@Body() offeringDto: CreateOfferingDto): Promise<IResponse> {
    return this.offeringService.create(offeringDto);
  }

  @Get()
  async findAll(
    @Query() pagination: PaginationDTO,
  ): Promise<IResult<Offering>> {
    return await this.offeringService.findAll(pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Offering> {
    return await this.offeringService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOfferingDto: UpdateOfferingDto,
  ) {
    return null;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<IResponse> {
    return await this.offeringService.remove(id);
  }
}
