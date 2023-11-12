import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { RequestDatingStatus } from '@common/consts';
import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse, IResult } from '@common/interfaces';

import { User } from '@modules/users/entities';

import { TokenDTO } from '@common/dto';
import {
  CreateScheduleDTO,
  FilterCountScheduleDTO,
  FilterGetAllScheduleDTO,
  ReviewDatingDTO,
  SuggestLocationDTO,
  UpdateScheduleDTO,
} from './dto';
import { LocationDating, Schedule } from './entities';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
@ApiTags(Schedule.name)
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @Get()
  @UseGuards(AtGuard)
  async findAll(@Query() filter: FilterGetAllScheduleDTO, @CurrentUser() user: User): Promise<IResult<Schedule>> {
    return await this.scheduleService.findAll(filter, user);
  }

  @Get('/count')
  async countScheduleByStatus(@Query() filter: FilterCountScheduleDTO, @CurrentUser() user: User): Promise<IResponse> {
    filter.userId = user._id;
    return await this.scheduleService.countScheduleByStatus(filter);
  }

  @Get('verify-token')
  async verifyTokenReviewDating(@Query() data: TokenDTO): Promise<IResponse> {
    const { token } = data;
    return await this.scheduleService.verifyTokenReviewDating(token);
  }

  @Post('sample-token')
  async sampleToken(@Body() data: any): Promise<string> {
    return await this.scheduleService.sendReviewDating(data);
  }

  @Get('/:id')
  @UseGuards(AtGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<Schedule> {
    return await this.scheduleService.getSchedulePlaceDetail(id, user);
  }

  @Post()
  @UseGuards(AtGuard)
  async create(@Body() scheduleDto: CreateScheduleDTO, @CurrentUser() user: User): Promise<IResponse> {
    return await this.scheduleService.create(scheduleDto, user);
  }

  @Post('cancel/:id')
  @UseGuards(AtGuard)
  async cancel(@Param('id') id: string, @CurrentUser() user: User): Promise<IResponse> {
    return await this.scheduleService.action(id, user, RequestDatingStatus.CANCEL);
  }

  @Post('accept/:id')
  @UseGuards(AtGuard)
  async accept(@Param('id') id: string, @CurrentUser() user: User): Promise<IResponse> {
    return await this.scheduleService.action(id, user, RequestDatingStatus.ACCEPT);
  }

  @Post('decline/:id')
  @UseGuards(AtGuard)
  async decline(@Param('id') id: string, @CurrentUser() user: User): Promise<IResponse> {
    return await this.scheduleService.action(id, user, RequestDatingStatus.DECLINE);
  }

  @Patch(':id')
  @UseGuards(AtGuard)
  async update(
    @Param('id') _id: string,
    @Body() updateDto: UpdateScheduleDTO,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    return await this.scheduleService.update(_id, updateDto, user);
  }

  @Delete(':id')
  @UseGuards(AtGuard)
  async delete(@Param('id') _id: string, @CurrentUser() user: User): Promise<IResponse> {
    return await this.scheduleService.delete(_id, user);
  }

  @Post('/suggest')
  @UseGuards(AtGuard)
  async suggestLocation(@Body() suggestDto: SuggestLocationDTO): Promise<LocationDating[]> {
    return await this.scheduleService.suggestLocation(suggestDto);
  }

  @Post('/review')
  @ApiBody({ type: ReviewDatingDTO })
  async review(@Query() data: TokenDTO, @Body() reviewDto: ReviewDatingDTO): Promise<IResponse> {
    const { token } = data;
    return await this.scheduleService.reviewDating(token, reviewDto);
  }
}
