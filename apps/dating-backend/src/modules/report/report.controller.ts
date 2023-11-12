import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';

import { CurrentUser, hasRoles } from '@common/decorators';
import { AtGuard, RolesGuard } from '@common/guards';
import { IResponse } from '@common/interfaces';
import { Admin } from '@modules/admin/entities';
import { User } from '@modules/users/entities';

import { CreateReportDto, FilterGetAllReportDTO } from './dto';
import { Report } from './entities';
import { ReportService } from './report.service';
import { Role } from '@common/consts';

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

  @Post('/block/:id')
  @UseGuards(AtGuard, RolesGuard)
  @hasRoles(Role.MASTER)
  async blockUser(@Param('id') id: string, @CurrentUser() admin: Admin) {
    return await this.reportService.blockUser(id, admin);
  }

  @Post('/unBlock/:id')
  @UseGuards(AtGuard, RolesGuard)
  @hasRoles(Role.MASTER)
  async unBlockUser(@Param('id') id: string, @CurrentUser() admin: Admin) {
    return await this.reportService.unBlock(id, admin);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportService.remove(+id);
  }
}
