import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DATABASE_TYPE, PROVIDER_REPO, RelationshipType } from '@common/consts';
import { PaginationDTO } from '@common/dto';
import { IResponse, IResult } from '@common/interfaces';
import { RelationshipRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { Relationship } from './entities';
import { CreateRelationshipDTO, UpdateRelationshipDto } from './dto';

@Injectable()
export class RelationshipService {
  constructor(
    @Inject(PROVIDER_REPO.RELATIONSHIP + DATABASE_TYPE.MONGO)
    private relationshipRepo: RelationshipRepo,
  ) {}

  async create(relationshipDto: CreateRelationshipDTO): Promise<IResponse> {
    try {
      const relationship = await this.relationshipRepo.insert(relationshipDto);
      await this.relationshipRepo.save(relationship);
      return {
        success: true,
        message: 'Tạo Relationship thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(pagination: PaginationDTO, type: RelationshipType): Promise<IResult<Relationship>> {
    try {
      const [queryFilter] = new FilterBuilder<Relationship>()
        .setFilterItem('isDeleted', '$eq', false, true)
        .setFilterItem('type', '$eq', type)
        .buildQuery();
      const [totalCount, results] = await Promise.all([
        this.relationshipRepo.count(queryFilter),
        this.relationshipRepo.findAll({
          queryFilter,
          pagination,
        }),
      ]);
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  async findOne(_id: string): Promise<Relationship> {
    try {
      const relationship = await this.relationshipRepo.findOne({
        queryFilter: { _id, isDeleted: false },
      });
      throwIfNotExists(relationship, 'Không tìm thấy Relationship');
      return relationship;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateRelationshipDto: UpdateRelationshipDto): Promise<IResponse> {
    try {
      const relationship = await this.relationshipRepo.findOneAndUpdate(id, updateRelationshipDto);
      throwIfNotExists(relationship, 'Không tìm thấy Relationship');
      return {
        success: true,
        message: 'Cập nhật Relationship thành công',
      };
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<IResponse> {
    try {
      const relationship = await this.relationshipRepo.findOneAndUpdate(id, {
        isDeleted: true,
      });
      if (!relationship) {
        throw new NotFoundException('Không tìm thấy Relationship');
      }
      return {
        success: true,
        message: 'Xóa Relationship thành công',
      };
    } catch (error) {
      throw error;
    }
  }
}
