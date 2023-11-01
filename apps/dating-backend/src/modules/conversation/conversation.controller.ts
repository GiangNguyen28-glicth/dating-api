import { AtGuard, CurrentUser, IResult } from '@dating/common';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { User } from '@modules/users/entities';

import { ConversationService } from './conversation.service';
import { Conversation } from './entities';
import { CreateConversationDto, FilterGetAllConversationDTO } from './dto';

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
