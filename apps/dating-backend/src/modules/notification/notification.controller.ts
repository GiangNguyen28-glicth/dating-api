import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse, IResult } from '@common/interfaces';
import { User } from '@modules/users/entities';

import {
  DeleteManyNotification,
  FilterGetAllNotification,
  UpdateNotificationByUserDto,
  UpdateNotificationDto,
} from './dto';
import { Notification } from './entities';
import { NotificationService } from './notification.service';
import { Schedule } from '@modules/schedule/entities';
import { PaginationDTO } from '@common/dto';
import { NotificationStatus } from '@common/consts';

@ApiTags(Notification.name)
@Controller('notification')
@UseGuards(AtGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(@CurrentUser() user: User, @Query() filter: FilterGetAllNotification): Promise<any> {
    return await this.notificationService.findAll(user, filter);
  }

  @Get('/schedule')
  async findAllBySchedule(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDTO,
  ): Promise<IResult<Notification>> {
    return await this.notificationService.findAllBySchedule(user, pagination);
  }

  @Get('count')
  async count(@CurrentUser() user: User): Promise<IResponse> {
    return await this.notificationService.countNoti(user);
  }

  @Get('count-schedule')
  async countSchedule(@CurrentUser() user: User): Promise<IResponse> {
    return await this.notificationService.countSchedule(user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<IResponse> {
    return this.notificationService.remove(id);
  }

  @Patch()
  @ApiBearerAuth()
  @ApiBody({ type: UpdateNotificationByUserDto })
  async updateMany(@Body() notiDto: UpdateNotificationByUserDto, @CurrentUser() user: User): Promise<IResponse> {
    return await this.notificationService.updateMany(notiDto, user);
  }

  @Patch('/schedule')
  @ApiBearerAuth()
  async updateNotiBySchedule(@CurrentUser() user: User): Promise<IResponse> {
    const update: UpdateNotificationDto = {
      status: NotificationStatus.RECEIVED,
    };
    return await this.notificationService.updateManyBySchedule(user, update);
  }
}
