import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators';
import { IResponse } from '@common/interfaces';
import { AtGuard } from '@common/guards';
import { User } from '@modules/users/entities';

import { ReportService } from './report.service';
import { Report } from './entities/report.entity';
import { CreateReportDto, FilterGetAllReportDTO, UpdateReportDto } from './dto';

@ApiTags(Report.name)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiBody({ type: CreateReportDto })
  @UseGuards(AtGuard)
  async create(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: User,
  ): Promise<IResponse> {
    const report = await this.reportService.create(createReportDto, user);
    if (!report) {
      throw new BadRequestException('Report thất bại');
    }
    return {
      success: true,
      message: 'Report thành công',
    };
  }

  @Get()
  async findAll(@Query() filter: FilterGetAllReportDTO) {
    return this.reportService.findAll(filter);
  }

  @Get(':id')
  @ApiParam({ type: 'string', name: 'id' })
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportService.update(+id, updateReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportService.remove(+id);
  }
}
