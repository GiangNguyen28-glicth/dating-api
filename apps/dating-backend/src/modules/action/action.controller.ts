import { Controller, Param, Post, UseGuards, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { User } from '@modules/users/entities';

import { ActionService } from './action.service';
import { Action } from './entities';

@Controller('action')
@ApiTags(Action.name)
@UseGuards(AtGuard)
export class ActionController {
  constructor(private actionService: ActionService) {}

  @Post('skip/:id')
  async skip(@CurrentUser() sender: User, @Param('id') id: string) {
    return await this.actionService.skip(sender, id);
  }

  @Post('like/:id')
  async like(@CurrentUser() sender: User, @Param('id') id: string) {
    return await this.actionService.like(sender, id);
  }

  @Post('boots/:id')
  async boots(@CurrentUser() sender: User, @Param('id') id: string) {}

  @Get('sample-data')
  async sampleData(): Promise<boolean> {
    await this.actionService.sampleData();
    return true;
  }
}
