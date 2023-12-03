import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AtGuard, CurrentUser, IResponse, IResult, Role, hasRoles } from '@dating/common';

import { User } from '@modules/users/entities';
import { FilterGetStatistic } from '@modules/admin/dto';

import { ConversationService } from './conversation.service';
import { FilterGetAllConversationDTO, SafeModeDTO } from './dto';
import { Conversation } from './entities';

@ApiTags(Conversation.name)
@ApiBearerAuth()
@Controller('conversation')
@UseGuards(AtGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query() filter: FilterGetAllConversationDTO,
  ): Promise<IResult<Conversation>> {
    return await this.conversationService.findAll(user, filter);
  }

  @Get('/statistic-matched')
  @UseGuards(AtGuard)
  @hasRoles(Role.MASTER)
  async statisticMatchedByRangeDate(@Query() filter: FilterGetStatistic) {
    return await this.conversationService.statisticByRangeDate(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<Conversation> {
    return await this.conversationService.findOne({ _id: id, toJSON: true, populate: true }, user);
  }

  @Post('safe-mode')
  async enableSafeMode(@Body() data: SafeModeDTO, @CurrentUser() user: User): Promise<IResponse> {
    if (data.enable) {
      return await this.conversationService.enableSafeMode(user, data.conversation);
    }
    return await this.conversationService.disableSafeMode(user, data.conversation);
  }
}
