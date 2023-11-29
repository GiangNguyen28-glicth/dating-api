import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse, IResult } from '@common/interfaces';
import { User } from '@modules/users/entities';

import { FilterGelAllMqDTO } from './dto';
import { MatchRequest } from './entities';
import { MatchRequestService } from './match-request.service';

@ApiTags(MatchRequest.name)
@Controller('match-request')
@ApiBearerAuth()
@UseGuards(AtGuard)
export class MatchRequestController {
  constructor(private readonly matchRequestService: MatchRequestService) {}

  @Get('count')
  async countMatchRequest(@CurrentUser() user: User): Promise<IResponse> {
    return await this.matchRequestService.countMatchRequest(user);
  }

  @Get()
  async findAll(@Query() filter: FilterGelAllMqDTO, @CurrentUser() user: User): Promise<IResult<MatchRequest>> {
    return await this.matchRequestService.findAll(filter, user, true);
  }
}
