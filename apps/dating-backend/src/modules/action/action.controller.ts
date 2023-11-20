import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MerchandisingType } from '@common/consts';
import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { User } from '@modules/users/entities';

import { ActionService } from './action.service';
import { Action } from './entities';
import { IResponse } from '@common/interfaces';

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
    return await this.actionService.action(sender, id, MerchandisingType.LIKE);
  }

  @Post('super-like/:id')
  async superLike(@CurrentUser() sender: User, @Param('id') id: string) {
    return await this.actionService.action(sender, id, MerchandisingType.SUPER_LIKE);
  }

  @Post('un-matched/:id')
  async unMatched(@CurrentUser() sender: User, @Param('id') id: string) {
    return await this.actionService.unMatched(sender, id);
  }

  @Post('/boosts')
  @UseGuards(AtGuard)
  async boosts(@CurrentUser() user: User): Promise<IResponse> {
    return await this.actionService.boosts(user);
  }
}
