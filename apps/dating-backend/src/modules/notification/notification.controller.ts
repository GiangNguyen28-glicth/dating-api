import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { IResponse } from '@common/interfaces';
import { AtGuard } from '@common/guards';
import { CurrentUser } from '@common/decorators';
import { User } from '@modules/users/entities';

import { FilterGetAllNotification } from './dto';
import { NotificationService } from './notification.service';
import { Notification } from './entities';

@ApiTags(Notification.name)
@Controller('notification')
@UseGuards(AtGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query() filter: FilterGetAllNotification,
  ) {
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
}
