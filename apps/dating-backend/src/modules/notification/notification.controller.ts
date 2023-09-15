import { Controller, Get, Param, Delete, UseGuards, Query, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { IResponse } from '@common/interfaces';
import { AtGuard } from '@common/guards';
import { CurrentUser } from '@common/decorators';
import { User } from '@modules/users/entities';

import { FilterGetAllNotification, UpdateNotificationByUserDto, UpdateNotificationDto } from './dto';
import { NotificationService } from './notification.service';
import { Notification } from './entities';

@ApiTags(Notification.name)
@Controller('notification')
@UseGuards(AtGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@CurrentUser() user: User, @Query() filter: FilterGetAllNotification) {
    return this.notificationService.findAll(user, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(+id);
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
}
