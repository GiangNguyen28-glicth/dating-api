import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { IResponse } from '@common/interfaces';
import { CurrentUser } from '@common/decorators';
import { User } from '@modules/users/entities';
import { AtGuard } from '@common/guards';

import { ScheduleService } from './schedule.service';
import { CreateScheduleDTO, SuggestLocationDTO, UpdateScheduleDTO } from './dto';
import { Schedule } from './entities';

@Controller('schedule')
@UseGuards(AtGuard)
@ApiTags(Schedule.name)
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @Post()
  async create(@Body() scheduleDto: CreateScheduleDTO, @CurrentUser() user: User): Promise<IResponse> {
    return await this.scheduleService.create(scheduleDto, user);
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
  async suggestLocation(@Body() suggestDto: SuggestLocationDTO): Promise<any> {
    return await this.scheduleService.suggestLocation(suggestDto);
  }
}
