import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DATABASE_TYPE, PROVIDER_REPO } from '@common/consts';
import { OfferingRepo } from '@dating/repositories';
import { PaginationDTO } from '@common/dto';
import { formatResult, throwIfNotExists } from '@dating/utils';
import { IResponse, IResult } from '@common/interfaces';

import { Offering, Package } from './entities';
import { CreateOfferingDto } from './dto';

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

  async findAll(pagination: PaginationDTO): Promise<IResult<Offering>> {
    try {
      const [results, totalCount] = await Promise.all([
        this.offeringRepo.findAll({
          queryFilter: { isDeleted: false },
          pagination,
        }),
        this.offeringRepo.count({ isDeleted: false }),
      ]);
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  async findOne(_id: string): Promise<Offering> {
    try {
      const offering = await this.offeringRepo.findOne({
        queryFilter: { _id },
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
}
