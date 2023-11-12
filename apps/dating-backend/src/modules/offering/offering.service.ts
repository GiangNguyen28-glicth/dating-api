import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { isNil, uniqBy } from 'lodash';

import { DATABASE_TYPE, OfferingType, PROVIDER_REPO, RefreshIntervalUnit } from '@common/consts';
import { OfferingRepo } from '@dating/repositories';
import { PaginationDTO } from '@common/dto';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { IResponse, IResult } from '@common/interfaces';

import { MerchandisingItem, Offering, Package } from './entities';
import { CreateOfferingDto, FilterGetAllOffering, FilterGetOneOfferingDTO, UpdateOfferingDto } from './dto';

@Injectable()
export class OfferingService {
  constructor(
    @Inject(PROVIDER_REPO.OFFERING + DATABASE_TYPE.MONGO)
    private offeringRepo: OfferingRepo,
  ) {}
  async create(offeringDto: CreateOfferingDto): Promise<IResponse> {
    try {
      offeringDto.packages.map(_package => {
        _package.price = _package.originalPrice;
        if (offeringDto.isRetail && offeringDto.type === OfferingType.FINDER_BOOSTS) {
          _package.refreshInterval = 30;
          _package.refreshIntervalUnit = RefreshIntervalUnit.MINUTES;
        }
        if (_package.discount > 0) {
          _package.price = Math.floor(_package.originalPrice * (_package.discount / 100));
        }
        return _package;
      });
      const offering: Offering = await this.offeringRepo.insert(offeringDto);
      await this.offeringRepo.save(offering);
      return {
        success: true,
        message: 'Tạo Offering thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGetAllOffering): Promise<IResult<Offering>> {
    try {
      const queryBuilder = new FilterBuilder<Offering>().setFilterItem('_id', '$in', filter?.ids);
      if (!isNil(filter?.isRetail)) {
        queryBuilder.setFilterItem('isRetail', '$eq', filter?.isRetail, true);
      }
      if (!isNil(filter?.isDeleted)) {
        queryBuilder.setFilterItem('isDeleted', '$eq', filter?.isDeleted, true);
      }
      const pagination: PaginationDTO = {
        page: filter?.page,
        size: filter?.size,
      };
      const [queryFilter] = queryBuilder.buildQuery();
      const [results, totalCount] = await Promise.all([
        this.offeringRepo.findAll({
          queryFilter,
          pagination,
        }),
        this.offeringRepo.count(queryFilter),
      ]);
      let featureGroup: MerchandisingItem[] = [];
      for (const offering of results) {
        if (!offering.isRetail) featureGroup.push(...offering.merchandising);
      }
      results.map(offering => {
        Offering.setSave(offering);
        return offering;
      });
      featureGroup = uniqBy(featureGroup, 'name');
      const response = formatResult(results, totalCount, pagination);
      response.metadata = { featureGroup };
      return response;
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneOfferingDTO): Promise<Offering> {
    try {
      const [queryFilter] = new FilterBuilder<Offering>()
        .setFilterItem('_id', '$eq', filter?._id)
        .setFilterItem('type', '$eq', filter?.type)
        .setFilterItem('isDeleted', '$eq', false, true)
        .buildQuery();
      const offering = await this.offeringRepo.findOne({
        queryFilter,
      });
      throwIfNotExists(offering, 'Không tìm thấy Offering');
      return offering;
    } catch (error) {
      throw error;
    }
  }

  getPackage(offering: Offering, packageId: string): Package {
    for (const item of offering.packages) {
      if (item._id.toString() == packageId) {
        return item;
      }
    }
    return null;
  }

  async remove(id: string): Promise<IResponse> {
    try {
      const offering = await this.offeringRepo.findOneAndUpdate(id, {
        isDeleted: true,
      });
      if (!offering) {
        throw new NotFoundException('Không tìm thấy Offering');
      }
      return {
        success: true,
        message: 'Xóa Offering thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async update(_id: string, entities: UpdateOfferingDto): Promise<IResponse> {
    try {
      const newOffering = await this.offeringRepo.findOneAndUpdate(_id, entities);
      throwIfNotExists(newOffering, 'Offering không tồn tại');
      return {
        success: true,
        message: 'Ok',
      };
    } catch (error) {
      throw error;
    }
  }
}
