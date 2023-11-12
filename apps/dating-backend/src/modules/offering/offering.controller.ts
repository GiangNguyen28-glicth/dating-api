import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { IResponse, IResult } from '@common/interfaces';

import { CreateOfferingDto, FilterGetAllOffering, UpdateOfferingDto } from './dto';
import { Offering } from './entities';
import { OfferingService } from './offering.service';

@ApiTags(Offering.name)
@Controller('offering')
export class OfferingController {
  constructor(private readonly offeringService: OfferingService) {}

  @Post()
  async create(@Body() offeringDto: CreateOfferingDto): Promise<IResponse> {
    return await this.offeringService.create(offeringDto);
  }

  @Get()
  async findAll(@Query() filter: FilterGetAllOffering): Promise<IResult<Offering>> {
    return await this.offeringService.findAll(filter);
  }

  @Get(':id')
  async findOne(@Param('id') _id: string): Promise<Offering> {
    return await this.offeringService.findOne({ _id });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOfferingDto: UpdateOfferingDto): Promise<IResponse> {
    return await this.offeringService.update(id, updateOfferingDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<IResponse> {
    return await this.offeringService.remove(id);
  }
}
