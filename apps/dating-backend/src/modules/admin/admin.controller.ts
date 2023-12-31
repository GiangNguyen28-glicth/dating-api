import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser, hasRoles } from '@common/decorators';
import { AtGuard, RolesGuard } from '@common/guards';
import { IResponse } from '@common/interfaces';
import { Role } from '@common/consts';

import { AdminService } from './admin.service';
import { CreateAdminDTO, FilterGetStatistic } from './dto';
import { Admin } from './entities';

@Controller('admin')
@ApiTags(Admin.name)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post()
  async create(@Body() dto: CreateAdminDTO): Promise<IResponse> {
    return await this.adminService.create(null, dto);
  }

  @Get('current-admin')
  @UseGuards(AtGuard, RolesGuard)
  @hasRoles(Role.MASTER)
  async getCurrentUser(@CurrentUser() admin: Admin) {
    return admin;
  }

  @Get('billing/statistic-revenue')
  @UseGuards(AtGuard, RolesGuard)
  async getBusinessStatisticByBilling(@Query() filter: FilterGetStatistic) {
    return await this.adminService.getBusinessStatisticByBilling(filter);
  }

  @Get('billing/top-user')
  @UseGuards(AtGuard, RolesGuard)
  async topUsersByRevenue(@Query() filter: FilterGetStatistic) {
    return await this.adminService.topUsersByRevenue(filter);
  }

  @Get('users/statistic-user')
  @UseGuards(AtGuard, RolesGuard)
  @hasRoles(Role.MASTER)
  async getUserStatistic(@Query() filter: FilterGetStatistic) {
    return await this.adminService.getUserStatistic(filter);
  }

  @Get('action/statistic')
  @UseGuards(AtGuard, RolesGuard)
  @hasRoles(Role.MASTER)
  async geActionStatistic(@Query() filter: FilterGetStatistic) {
    return await this.adminService.getActionStatistic(filter);
  }
}
