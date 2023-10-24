import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse, IResult } from '@common/interfaces';
import { User } from '@modules/users/entities';

import {
  CreateScheduleDTO,
  FilterCountScheduleDTO,
  FilterGetAllScheduleDTO,
  SuggestLocationDTO,
  UpdateScheduleDTO,
} from './dto';
import { LocationDating, Schedule } from './entities';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
@UseGuards(AtGuard)
@ApiTags(Schedule.name)
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @Get()
  async findAll(@Query() filter: FilterGetAllScheduleDTO, @CurrentUser() user: User): Promise<IResult<Schedule>> {
    filter.userId = user._id;
    return await this.scheduleService.findAll(filter);
  }

  @Get('/count')
  async countScheduleByStatus(@Query() filter: FilterCountScheduleDTO, @CurrentUser() user: User): Promise<IResponse> {
    filter.userId = user._id;
    return await this.scheduleService.countScheduleByStatus(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<Schedule> {
    return await this.scheduleService.getSchedulePlaceDetail(id, user);
  }

  @Post()
  async create(@Body() scheduleDto: CreateScheduleDTO, @CurrentUser() user: User): Promise<IResponse> {
    return await this.scheduleService.create(scheduleDto, user);
  }

  @Post('cancel/:id')
  async cancel(@Param('id') id: string, @CurrentUser() user: User): Promise<IResponse> {
    return await this.scheduleService.cancel(id, user);
  }

  @Patch(':id')
  async update(
    @Param('id') _id: string,
    @Body() updateDto: UpdateScheduleDTO,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    return await this.scheduleService.update(_id, updateDto, user);
  }

  @Delete(':id')
  async delete(@Param('id') _id: string, @CurrentUser() user: User): Promise<IResponse> {
    return await this.scheduleService.delete(_id, user);
  }

  @Post('suggest')
  async suggestLocation(@Body() suggestDto: SuggestLocationDTO): Promise<LocationDating[]> {
    return await this.scheduleService.suggestLocation(suggestDto);
  }

  @Get('searchText')
  async searchText(): Promise<any> {
    return await this.scheduleService.getPlaceById('ChIJBSrTl4jPdDER95i-ubBjN04');
  }
}
