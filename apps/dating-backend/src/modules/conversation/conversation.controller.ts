import { AtGuard, CurrentUser, IResult } from '@dating/common';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { FilterGetAllConversationDTO } from './dto/conversation.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from './entities/conversation.entity';

@ApiTags(Conversation.name)
@ApiBearerAuth()
@Controller('conversation')
@UseGuards(AtGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationService.create(createConversationDto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query() filter: FilterGetAllConversationDTO,
  ): Promise<IResult<Conversation>> {
    return this.conversationService.findAll(user, filter);
  }
}
