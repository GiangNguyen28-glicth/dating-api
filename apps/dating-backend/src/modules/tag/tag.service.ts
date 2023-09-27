import { DATABASE_TYPE, IResponse, IResult, PROVIDER_REPO, PaginationDTO } from '@dating/common';
import { TagRepo } from '@dating/repositories';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { Inject, Injectable } from '@nestjs/common';
import { CreateTagDTO, FilterGetAllTagDTO, FilterGetOneTag, UpdateTagDTO } from './dto';
import { Tag } from './entities';

@Injectable()
export class TagService {
  constructor(@Inject(PROVIDER_REPO.TAG + DATABASE_TYPE.MONGO) protected tagRepo: TagRepo) {}

  async findAll(filter?: FilterGetAllTagDTO): Promise<IResult<Tag>> {
    try {
      const [queryFilter, sortOption] = new FilterBuilder<Tag>()
        .setFilterItem('type', '$eq', filter?.type)
        .setFilterItem('_id', '$in', filter?.ids)
        // .setFilterItem('parentType', '$eq', filter?.parentType)
        .setSortItem('createdAt', 1)
        .buildQuery();
      const pagination: PaginationDTO = {
        size: filter?.size,
        page: filter?.page,
      };
      const [results, totalCount] = await Promise.all([
        this.tagRepo.findAll({ pagination, queryFilter, sortOption }),
        this.tagRepo.count(queryFilter),
      ]);
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneTag): Promise<Tag> {
    try {
      const { _id, type } = filter;
      const tag = await this.tagRepo.findOne({ queryFilter: { _id, type } });
      throwIfNotExists(tag, 'Không thể tìm thấy Tag');
      return tag;
    } catch (error) {
      throw error;
    }
  }

  async findOneAndUpdate(_id: string, updateTagDto: UpdateTagDTO): Promise<Tag> {
    try {
      return await this.tagRepo.findOneAndUpdate(_id, updateTagDto);
    } catch (error) {
      throw error;
    }
  }

  async create(tagDto: CreateTagDTO): Promise<IResponse> {
    try {
      const tag = await this.tagRepo.insert(tagDto);
      await this.tagRepo.save(tag);
      return {
        success: true,
        message: 'Tao Tag thanh cong',
      };
    } catch (error) {
      throw error;
    }
  }
}
