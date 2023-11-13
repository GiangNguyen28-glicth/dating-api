import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { get, groupBy, mapValues, orderBy, sum, sumBy, values } from 'lodash';

import { IResponse } from '@common/interfaces';
import { compareHashValue, getFormatGroupISODate, hash, throwIfNotExists } from '@dating/utils';

import { BillingService } from '@modules/billing/billing.service';
import { OfferingService } from '@modules/offering/offering.service';

import { AdminAuthDTO } from '@modules/auth/dto';

import { CreateAdminDTO, FilterGetBillingStatistic, FilterGetOneAdminDTO } from './dto';
import { Admin, AdminModelType } from './entities';
import { OfferingType } from '@common/consts';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: AdminModelType,
    private billingService: BillingService,
    private offeringService: OfferingService,
  ) {}

  async create(admin: Admin, dto: CreateAdminDTO): Promise<IResponse> {
    try {
      const hashPassword = await hash(dto.password);
      const newAdmin = await this.adminModel.create(dto);
      newAdmin.password = hashPassword;
      newAdmin.createdBy = admin._id;
      await newAdmin.save();
      return {
        success: true,
        message: 'Ok',
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

  async getBusinessStatisticByBilling(filter: FilterGetBillingStatistic): Promise<any> {
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

  async topUsersByRevenue(filter: FilterGetBillingStatistic): Promise<any> {
    const data = await this.billingService.topUsersByRevenue(filter);
    data.map(item => {
      let totalAmount = 0;
      let totalOtherAmount = 0;
      let totalOtherCount = 0;
      for (const type of item.types) {
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
      }
      item.totalAmount = totalAmount;
      item.totalOtherAmount = totalOtherAmount;
      item.totalOtherCount = totalOtherCount;
    });
    return orderBy(data, ['totalAmount'], ['desc']);
  }
}
