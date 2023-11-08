import {
  BadRequestException,
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
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators';
import { AtGuard } from '@common/guards';
import { IResponse } from '@common/interfaces';
import { User } from '@modules/users/entities';

import { CreateReportDto, FilterGetAllReportDTO, UpdateReportDto } from './dto';
import { Report } from './entities';
import { ReportService } from './report.service';

@ApiTags(Report.name)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiBody({ type: CreateReportDto })
  @UseGuards(AtGuard)
  async create(@Body() createReportDto: CreateReportDto, @CurrentUser() user: User): Promise<IResponse> {
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
    return await this.reportService.findAll(filter);
  }

  @Get(':id')
  @ApiParam({ type: 'string', name: 'id' })
  async findOne(@Param('id') id: string): Promise<Report> {
    return await this.reportService.findOne(id);
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
