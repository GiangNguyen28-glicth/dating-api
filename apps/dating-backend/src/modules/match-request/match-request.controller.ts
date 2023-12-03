import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, hasRoles } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse, IResult } from '@common/interfaces';
import { Role } from '@common/consts';

import { User } from '@modules/users/entities';
import { FilterGetStatistic } from '@modules/admin/dto';

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

  @Get('/statistic-like')
  @UseGuards(AtGuard)
  @hasRoles(Role.MASTER)
  async statisticLikeByRangeDate(@Query() filter: FilterGetStatistic) {
    return await this.matchRequestService.statisticLikeByRangeDate(filter);
  }

  @Get('/statistic-passes')
  @UseGuards(AtGuard)
  @hasRoles(Role.MASTER)
  async statisticSkipByRangeDate(@Query() filter: FilterGetStatistic) {
    return await this.matchRequestService.statisticSkipByRangeDate(filter);
  }
}
