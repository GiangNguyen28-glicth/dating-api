import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AtGuard, CurrentUser, IResult } from '@dating/common';

import { User } from '@modules/users/entities';

import { ConversationService } from './conversation.service';
import { FilterGetAllConversationDTO } from './dto';
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

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User): Promise<Conversation> {
    return await this.conversationService.findOne({ _id: id, toJSON: true, populate: true }, user);
  }
}
