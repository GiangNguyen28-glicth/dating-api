import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards, Post } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { AtGuard } from '@common/guards';
import { IResponse, IResult } from '@common/interfaces';
import { CurrentUser } from '@common/decorators';
import { User } from '@modules/users/entities';

import { CreateMessageDto, FilterGetAllMessageDTO, UpdateMessageDto } from './dto';
import { Message } from './entities';
import { MessageService } from './message.service';

@ApiTags(Message.name)
@UseGuards(AtGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async create(@Body() dto: CreateMessageDto, @CurrentUser() user: User): Promise<any> {
    return await this.messageService.create(dto, user);
  }

  @Get()
  async findAll(@Query() filter: FilterGetAllMessageDTO): Promise<IResult<Message>> {
    return await this.messageService.findAll(filter);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() messageDto: UpdateMessageDto) {
    return await this.messageService.findOneAndUpdate(id, messageDto);
  }

  @Delete(':id')
  @ApiParam({ type: 'string', name: 'id' })
  async remove(@Param('id') id: string): Promise<IResponse> {
    return await this.messageService.remove(id);
  }
}
