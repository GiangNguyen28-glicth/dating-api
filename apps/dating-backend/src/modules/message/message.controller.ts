import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { CurrentUser, hasRoles } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse, IResult } from '@common/interfaces';
import { User } from '@modules/users/entities';

import { Role } from '@common/consts';
import { FilterGetAllMessageDTO, FilterGetAllMessageReviews, ReviewCallDTO } from './dto';
import { Message } from './entities';
import { MessageService } from './message.service';

@ApiTags(Message.name)
@UseGuards(AtGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  async findAll(@Query() filter: FilterGetAllMessageDTO, @CurrentUser() user: User): Promise<IResult<Message>> {
    return await this.messageService.findAll(filter, user);
  }

  @Get('/rating')
  @hasRoles(Role.MASTER)
  async getRatingByMessageCall(): Promise<IResult<Message>> {
    return await this.messageService.getRatingByMessageCall();
  }

  @Get('/reviews')
  @hasRoles(Role.MASTER)
  async getReviewsMessageCall(@Query() filter: FilterGetAllMessageReviews): Promise<IResult<Message>> {
    return await this.messageService.getReviewsByMessageCall(filter);
  }

  @Get('/call')
  @hasRoles(Role.MASTER)
  async getCallStatistic(): Promise<IResult<Message>> {
    return await this.messageService.getCallStatistic();
  }

  @Post('/reviews')
  async reviewCallMessage(@Body() reviewDto: ReviewCallDTO, @CurrentUser() user: User): Promise<IResponse> {
    return await this.messageService.reviewCallMessage(reviewDto, user);
  }

  @Delete(':id')
  @ApiParam({ type: 'string', name: 'id' })
  async remove(@Param('id') id: string): Promise<IResponse> {
    return await this.messageService.remove(id);
  }
}
