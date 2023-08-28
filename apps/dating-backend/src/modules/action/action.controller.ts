import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AtGuard } from '@common/guards';
import { User } from '@modules/users/entities/user.entity';
import { ActionService } from './action.service';
import { Action } from './entites/action.entity';
import { CurrentUser } from '@common/decorators';

@Controller('action')
@ApiTags(Action.name)
@UseGuards(AtGuard)
export class ActionController {
  constructor(private actionService: ActionService) {}

  @Post('skip/:id')
  async skip(@CurrentUser() owner: User, @Param('id') id: string) {
    return await this.actionService.skip(owner, id);
  }

  @Post('like/:id')
  async like(@CurrentUser() owner: User, @Param('id') id: string) {
    return await this.actionService.like(owner, id);
  }
}
