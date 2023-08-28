import { DATABASE_TYPE, PROVIDER_REPO } from '@common/consts';
import { PaginationDTO } from '@common/dto';
import { IResponse, IResult } from '@common/interfaces';
import { MatchRequestRepo } from '@dating/repositories/match-request.repo';
import { FilterBuilder, formatResult } from '@dating/utils';
import { Inject, Injectable } from '@nestjs/common';
import { PopulateOptions } from 'mongoose';
import { CreateMatchRequestDto } from './dto/create-match-request.dto';
import { FilterGelAllMqDTO, FilterGetOneMq } from './dto/match-request.dto';
import { MatchRequest } from './entities/match-request.entity';
import { User } from '@modules/users/entities/user.entity';

@Injectable()
export class MatchRequestService {
  constructor(
    @Inject(PROVIDER_REPO.MATCH_REQUEST + DATABASE_TYPE.MONGO)
    private matchRequestRepo: MatchRequestRepo,
  ) {}
  async create(matchRequestDto: CreateMatchRequestDto): Promise<MatchRequest> {
    try {
      const matchRequest = await this.matchRequestRepo.insert(matchRequestDto);
      await this.matchRequestRepo.save(matchRequest);
      return matchRequest;
    } catch (error) {
      throw error;
    }
  }

  async findAll(
    filter: FilterGelAllMqDTO,
    user: User,
    isPopulate = false,
  ): Promise<IResult<MatchRequest>> {
    try {
      const pagination: PaginationDTO = {
        size: filter?.size,
        page: filter?.page,
      };
      const basicFieldsPopulate = ['_id,name,images', 'tags', 'bio'];
      const populate: PopulateOptions[] = [];
      if (isPopulate) {
        populate.push({
          path: 'requestBy',
          select: basicFieldsPopulate.join(' '),
        });
      }
      const [queryFilter] = new FilterBuilder<MatchRequest>()
        .setFilterItem('owner', '$eq', user?._id.toString())
        .buildQuery();
      const [results, totalCount] = await Promise.all([
        this.matchRequestRepo.findAll({ queryFilter, populate, pagination }),
        this.matchRequestRepo.count(queryFilter),
      ]);
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  async findOne(filter: FilterGetOneMq): Promise<MatchRequest> {
    try {
      const [queryFilter] = new FilterBuilder<MatchRequest>()
        .setFilterItem('owner', '$eq', filter?.owner)
        .setFilterItem('requestBy', '$eq', filter?.requestBy)
        .buildQuery();
      return await this.matchRequestRepo.findOne({ queryFilter });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<IResponse> {
    try {
      await this.matchRequestRepo.delete(id);
      return {
        success: true,
        message: 'Xoa thanh cong MatchRequest',
      };
    } catch (error) {
      throw error;
    }
  }
}
