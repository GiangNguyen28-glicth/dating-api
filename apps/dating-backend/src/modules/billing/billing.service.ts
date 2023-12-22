import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { isNil } from 'lodash';

import { BillingStatus, DATABASE_TYPE, MongoQuery, PROVIDER_REPO } from '@common/consts';
import { CurrentUser } from '@common/decorators';
import { IResponse, IResult } from '@common/interfaces';
import { BillingRepo } from '@dating/repositories';

import { FilterBuilder, throwIfNotExists } from '@dating/utils';
import { User } from '@modules/users/entities';

import { FilterGetStatistic } from '@modules/admin/dto';
import { CreateBillingDto, FilterGetAllBillingDTO, FilterGetOneBillingDTO, UpdateBillingDto } from './dto';
import { Billing } from './entities';
import { Offering } from '@modules/offering/entities';

@Injectable()
export class BillingService {
  constructor(
    @Inject(PROVIDER_REPO.BILLING + DATABASE_TYPE.MONGO)
    private billingRepo: BillingRepo,
  ) {}

  async create(billingDto: CreateBillingDto): Promise<Billing> {
    try {
      const billing = await this.billingRepo.insert(billingDto);
      return await this.billingRepo.save(billing);
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGetAllBillingDTO, @CurrentUser() user?: User): Promise<IResult<Billing>> {
    try {
      const queryBuilder = new FilterBuilder<Billing>()
        .setFilterItem('createdBy', '$eq', user?._id)
        .setFilterItem('status', '$eq', filter?.status);
      if (!isNil(filter?.expired)) {
        const query: MongoQuery = filter?.expired != 0 ? '$gte' : '$lte';
        queryBuilder.setFilterItem('expiredDate', query, new Date());
      }
      if (filter?.fromDate && filter?.toDate) {
        queryBuilder.setFilterItemWithObject('createdAt', { $gte: filter?.fromDate, $lte: filter?.toDate });
      }
      const [queryFilter] = queryBuilder.setSortItem('createdAt', 'desc').buildQuery();
      const [totalCount, results] = await Promise.all([
        this.billingRepo.count(queryFilter),
        this.billingRepo.findAll({ queryFilter }),
      ]);
      return { results, pagination: { totalCount } };
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneBillingDTO): Promise<Billing> {
    try {
      const [queryFilter] = new FilterBuilder<Billing>()
        .setFilterItem('_id', '$eq', filter?._id)
        .setFilterItem('isDeleted', '$eq', false, true)
        .buildQuery();
      const billing = await this.billingRepo.findOne({ queryFilter });
      throwIfNotExists(billing, 'Không tìm thấy Bill');
      return billing;
    } catch (error) {
      throw error;
    }
  }

  async findOneAndUpdate(id: string, updateBillingDto: UpdateBillingDto) {
    return await this.billingRepo.findOneAndUpdate(id, updateBillingDto);
  }

  async remove(_id: string): Promise<IResponse> {
    try {
      const billing = await this.billingRepo.findOneAndUpdate(_id, {
        isDeleted: true,
      });
      if (!billing) {
        throw new NotFoundException('Không thể tìm thấy Bill');
      }
      return {
        success: true,
        message: 'Xóa bill thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async statisticRevenue(filter: FilterGetStatistic): Promise<any[]> {
    const queryBuilder = new FilterBuilder<Billing>().setFilterItem('status', '$eq', BillingStatus.SUCCESS);
    if (filter?.fromDate && filter?.toDate) {
      queryBuilder.setFilterItemWithObject('createdAt', { $gte: filter?.fromDate, $lte: filter?.toDate });
    }
    const [queryFilter] = queryBuilder.buildQuery();
    return await this.billingRepo.statisticRevenue(queryFilter, filter.format);
  }

  async topUsersByRevenue(filter: FilterGetStatistic): Promise<any[]> {
    const queryBuilder = new FilterBuilder<Billing>().setFilterItem('status', '$eq', BillingStatus.SUCCESS);
    if (filter?.fromDate && filter?.toDate) {
      queryBuilder.setFilterItemWithObject('createdAt', { $gte: filter?.fromDate, $lte: filter?.toDate });
    }
    const [queryFilter] = queryBuilder.buildQuery();
    return await this.billingRepo.topUsersByRevenue(queryFilter);
  }

  async findOneByCurrentUser(userId: string): Promise<Billing> {
    const [queryFilter] = new FilterBuilder<Billing>()
      .setFilterItem('createdBy', '$eq', userId)
      .setFilterItem('expiredDate', '$gte', new Date())
      .setFilterItem('isRetail', '$eq', false, true)
      .buildQuery();
    const selectOfferingFields: Array<keyof Offering> = ['_id', 'type', 'level'];
    const billing = await this.billingRepo.findOne({
      queryFilter,
      populate: [{ path: 'offering', select: selectOfferingFields.join(' ') }],
    });
    if (billing) {
      return await this.billingRepo.toJSON(billing);
    }
    return null;
  }

  async save(billing: Billing): Promise<void> {
    try {
      await this.billingRepo.save(billing);
    } catch (error) {
      throw error;
    }
  }
}
