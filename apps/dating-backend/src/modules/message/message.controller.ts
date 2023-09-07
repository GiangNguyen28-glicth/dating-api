import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse, IResult } from '@common/interfaces';
import { User } from '@modules/users/entities';

import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CreateMessageDto,
  FilterGetAllMessageDTO,
  UpdateMessageDto,
} from './dto';
import { Message } from './entities';
import { MessageService } from './message.service';

@ApiTags(Message.name)
@UseGuards(AtGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiBody({ type: CreateMessageDto })
  create(@Body() messageDto: CreateMessageDto, @CurrentUser() user: User) {
    return this.messageService.create(messageDto, user);
  }

  @Get()
  async findAll(
    @Query() filter: FilterGetAllMessageDTO,
  ): Promise<IResult<Message>> {
    return await this.messageService.findAll(filter);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() messageDto: UpdateMessageDto) {
    return this.messageService.findOneAndUpdate(id, messageDto);
  }

  @Delete(':id')
  @ApiParam({ type: 'string', name: 'id' })
  async remove(@Param('id') id: string): Promise<IResponse> {
    return await this.messageService.remove(id);
  }
}
