import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { get, groupBy, mapValues, orderBy, sum, sumBy, values } from 'lodash';

import { IResponse } from '@common/interfaces';
import { compareHashValue, getFormatGroupISODate, hash, throwIfNotExists } from '@dating/utils';
import { OK, OfferingType } from '@common/consts';

import { BillingService } from '@modules/billing/billing.service';
import { OfferingService } from '@modules/offering/offering.service';
import { UserService } from '@modules/users/users.service';
import { ConversationService } from '@modules/conversation/conversation.service';
import { MatchRequestService } from '@modules/match-request/match-request.service';
import { ScheduleService } from '@modules/schedule/schedule.service';

import { AdminAuthDTO } from '@modules/auth/dto';

import { CreateAdminDTO, FilterGetStatistic, FilterGetOneAdminDTO } from './dto';
import { Admin, AdminModelType } from './entities';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: AdminModelType,
    private billingService: BillingService,
    private offeringService: OfferingService,
    private userService: UserService,
    private conversationService: ConversationService,
    private matchRqService: MatchRequestService,
    private scheduleService: ScheduleService,
  ) {}

  async create(admin: Admin, dto: CreateAdminDTO): Promise<IResponse> {
    try {
      const hashPassword = await hash(dto.password);
      const newAdmin = await this.adminModel.create(dto);
      newAdmin.password = hashPassword;
      // newAdmin.createdBy = admin._id;
      await newAdmin.save();
      return {
        success: true,
        message: OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneAdminDTO): Promise<Admin> {
    try {
      return await this.adminModel.findOne(filter);
    } catch (error) {
      throw error;
    }
  }

  async login(auth: AdminAuthDTO): Promise<Admin> {
    const admin = await this.findOne({ email: auth.email });
    throwIfNotExists(admin, 'Tài khoản không tồn tại');
    const isCorrectPassword = await compareHashValue(auth.password, admin.password);
    if (!isCorrectPassword) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại');
    }
    return admin;
  }

  async getBusinessStatisticByBilling(filter: FilterGetStatistic): Promise<any> {
    filter.format = getFormatGroupISODate(filter?.typeRange);
    const statisticRevenue = await this.billingService.statisticRevenue(filter);
    const groupedData = groupBy(statisticRevenue, item => get(item, '_id.offering'));
    const offeringIds: string[] = Object.keys(groupedData);
    const offerings = await this.offeringService.findAll({ ids: offeringIds });
    const trendLineData = mapValues(groupedData, items => {
      const offering = offerings.results.find(item => item._id == String(get(items[0], '_id.offering', null)));
      return {
        data: items.map(item => {
          return {
            date: item._id.date,
            totalAmount: item.totalAmount,
          };
        }),
        offering: {
          _id: offering._id,
          iconUrl: offering.iconUrl,
          type: offering.type,
          text: offering.text,
          style: offering.style,
        },
      };
    });
    const sumByOfferingType = mapValues(groupedData, items => {
      return sumBy(items, 'totalAmount');
    });
    const totalSum = sum(values(sumByOfferingType));
    const breakdownData = mapValues(sumByOfferingType, (value, key) => {
      const offering = offerings.results.find(item => key === item._id.toString());
      const ratio = Number((value / totalSum).toFixed(2)) * 100;
      return {
        ratio,
        value,
        offering: {
          _id: offering._id,
          iconUrl: offering.iconUrl,
          type: offering.type,
          text: offering.text,
          style: offering.style,
        },
      };
    });
    return { trendLine: trendLineData, breakDown: breakdownData };
  }

  async topUsersByRevenue(filter: FilterGetStatistic): Promise<any> {
    const data = await this.billingService.topUsersByRevenue(filter);
    data.map(item => {
      let totalAmount = 0;
      let totalOtherAmount = 0;
      let totalOtherCount = 0;
      for (const [index, type] of item.types.entries()) {
        if (
          ![
            OfferingType.FINDER_PREMIUM,
            OfferingType.FINDER_PLUS,
            OfferingType.FINDER_BOOSTS,
            OfferingType.FINDER_SUPER_LIKE,
          ].includes(type.type)
        ) {
          totalOtherAmount += type.totalAmount;
          totalOtherCount += type.count;
        }
        totalAmount += type.totalAmount;
        item.types[index].isMonitoring = true;
      }
      item.totalAmount = totalAmount;
      item.totalOtherAmount = totalOtherAmount;
      item.totalOtherCount = totalOtherCount;
    });
    return orderBy(data, ['totalAmount'], ['desc']);
  }

  async getUserStatistic(filter: FilterGetStatistic): Promise<any> {
    filter.format = getFormatGroupISODate(filter?.typeRange);
    return await this.userService.statisticByRangeDate(filter);
  }

  async getActionStatistic(filter: FilterGetStatistic): Promise<any> {
    filter.format = getFormatGroupISODate(filter?.typeRange);
    return await Promise.all([
      this.conversationService.statisticByRangeDate(filter),
      this.matchRqService.statisticLikeByRangeDate(filter),
      this.matchRqService.statisticSkipByRangeDate(filter),
      this.scheduleService.statisticByRangeDate(filter),
    ]);
  }
}
