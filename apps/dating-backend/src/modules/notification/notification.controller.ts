import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';

import { IResponse } from '@common/interfaces';
import { AtGuard } from '@common/guards';
import { CurrentUser } from '@common/decorators';
import { User } from '@modules/users';

import { FilterGetAllNotification } from './dto';
import { NotificationService } from './notification.service';

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
