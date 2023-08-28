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
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ApiBody, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AtGuard } from '@common/guards';
import { CurrentUser } from '@common/decorators';
import { FilterGetAllMessageDTO } from './dto/filter-message.dto';
import { User } from '@modules/users/entities/user.entity';
import { Message } from './entities/message.entity';

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
  @ApiQuery({ type: FilterGetAllMessageDTO })
  findAll(@Query() filter: FilterGetAllMessageDTO) {
    return this.messageService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messageService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messageService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  @ApiParam({ type: 'string', name: 'id' })
  remove(@Param('id') id: string) {
    return this.messageService.remove(id);
  }
}
