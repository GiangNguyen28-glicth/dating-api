import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResult } from '@common/interfaces';
import { User } from '@modules/users/entities';

import { MatchRequest } from './entities';
import { MatchRequestService } from './match-request.service';
import { CreateMatchRequestDto, FilterGelAllMqDTO } from './dto';

@ApiTags(MatchRequest.name)
@Controller('match-request')
@ApiBearerAuth()
@UseGuards(AtGuard)
export class MatchRequestController {
  constructor(private readonly matchRequestService: MatchRequestService) {}

  @Post()
  async create(@Body() data: CreateMatchRequestDto): Promise<MatchRequest> {
    return await this.matchRequestService.create(data);
  }

  @Get()
  async findAll(
    @Query() filter: FilterGelAllMqDTO,
    @CurrentUser() user: User,
  ): Promise<IResult<MatchRequest>> {
    return await this.matchRequestService.findAll(filter, user, true);
  }
}
