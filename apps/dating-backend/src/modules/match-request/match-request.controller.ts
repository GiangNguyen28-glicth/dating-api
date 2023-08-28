import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { User } from '@modules/users/entities/user.entity';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateMatchRequestDto } from './dto/create-match-request.dto';
import { FilterGelAllMqDTO } from './dto/match-request.dto';
import { MatchRequest } from './entities/match-request.entity';
import { MatchRequestService } from './match-request.service';
import { IResult } from '@common/interfaces';

@ApiTags(MatchRequest.name)
@Controller('match-request')
@ApiBearerAuth()
@UseGuards(AtGuard)
export class MatchRequestController {
  constructor(private readonly matchRequestService: MatchRequestService) {}

  @Post()
  create(@Body() createMatchRequestDto: CreateMatchRequestDto) {
    return this.matchRequestService.create(createMatchRequestDto);
  }

  @Get()
  async findAll(
    @Query() filter: FilterGelAllMqDTO,
    @CurrentUser() user: User,
  ): Promise<IResult<MatchRequest>> {
    return this.matchRequestService.findAll(filter, user, true);
  }
}
