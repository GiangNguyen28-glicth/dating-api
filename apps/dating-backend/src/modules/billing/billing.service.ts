import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CurrentUser } from '@common/decorators';
import { IResponse, IResult } from '@common/interfaces';
import { DATABASE_TYPE, PROVIDER_REPO } from '@common/consts';
import { BillingRepo } from '@dating/repositories';
import { FilterBuilder, throwIfNotExists } from '@dating/utils';
import { User } from '@modules/users/entities';

import { Billing } from './entities';
import {
  CreateBillingDto,
  FilterGetAllBillingDTO,
  FilterGetOneBillingDTO,
  UpdateBillingDto,
} from './dto';

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

  async findAll(
    filter: FilterGetAllBillingDTO,
    @CurrentUser() user?: User,
  ): Promise<IResult<Billing>> {
    try {
      const [queryFilter] = new FilterBuilder<Billing>()
        .setFilterItem('createdBy', '$eq', user?._id)
        .setFilterItem('isDeleted', '$eq', false, true)
        .setFilterItem('expiredDate', '$gte', filter?.expiredDate)
        .setFilterItem('status', '$eq', filter?.status)
        .setSortItem('createdAt', 'desc')
        .buildQuery();
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
}
