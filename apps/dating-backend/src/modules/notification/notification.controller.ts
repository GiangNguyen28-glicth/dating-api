import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse, IResult } from '@common/interfaces';

import { User } from '@modules/users/entities';

import { FilterGetAllNotification, UpdateNotificationDto } from './dto';
import { Notification } from './entities';
import { NotificationService } from './notification.service';

@ApiTags(Notification.name)
@Controller('notification')
@UseGuards(AtGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(@CurrentUser() user: User, @Query() filter: FilterGetAllNotification): Promise<IResult<Notification>> {
    return await this.notificationService.findAll(user, filter);
  }

  @Get('count')
  async count(@CurrentUser() user: User, @Query() filter: FilterGetAllNotification): Promise<IResponse> {
    return await this.notificationService.countNoti(user, filter);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<IResponse> {
    return await this.notificationService.remove(id);
  }

  @Patch('/received')
  @ApiBearerAuth()
  async updateStatus(
    @CurrentUser() user: User,
    @Query() filter: FilterGetAllNotification,
    @Body() notification: UpdateNotificationDto,
  ): Promise<IResponse> {
    filter.receiver = user._id;
    return await this.notificationService.updateStatusToReceived(filter, notification);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() notification: UpdateNotificationDto,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    return await this.notificationService.findOneAndUpdate(id, notification, user);
  }
}
