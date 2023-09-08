import { Inject, Injectable } from '@nestjs/common';
import { ReportRepo } from '@dating/repositories';
import { DATABASE_TYPE, PROVIDER_REPO } from '@common/consts';
import { IResult } from '@common/interfaces';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { PaginationDTO } from '@common/dto';
import { User } from '@modules/users/entities';

import { CreateReportDto, FilterGetAllReportDTO, UpdateReportDto } from './dto';
import { Report } from './entities';
@Injectable()
export class ReportService {
  constructor(
    @Inject(PROVIDER_REPO.REPORT + DATABASE_TYPE.MONGO)
    private reportRepo: ReportRepo,
  ) {}
  async create(createReportDto: CreateReportDto, user: User): Promise<Report> {
    try {
      createReportDto['reportBy'] = user._id;
      const report = await this.reportRepo.insert(createReportDto);
      await this.reportRepo.save(report);
      return report;
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGetAllReportDTO): Promise<IResult<Report>> {
    try {
      const [queryFilter, sortOption] =
        new FilterBuilder<Report>().buildQuery();
      const pagination: PaginationDTO = {
        size: filter?.size,
        page: filter?.page,
      };
      const [results, totalCount] = await Promise.all([
        this.reportRepo.findAll({ queryFilter, pagination, sortOption }),
        this.reportRepo.count(queryFilter),
      ]);
      return formatResult(results, totalCount, pagination);
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<Report> {
    try {
      const basicFieldsPopulate = ['_id', 'name', 'email'];
      const report = await this.reportRepo.findOne({
        queryFilter: { _id: id },
        populate: [
          {
            path: 'reportBy',
            select: basicFieldsPopulate.join(' '),
          },
          {
            path: 'reportedUser',
            select: basicFieldsPopulate.join(' '),
          },
        ],
      });
      throwIfNotExists(report, 'Không tìm thấy report');
      return report;
    } catch (error) {
      throw error;
    }
  }

  update(id: number, updateReportDto: UpdateReportDto) {
    return `This action updates a #${id} report`;
  }

  remove(id: number) {
    return `This action removes a #${id} report`;
  }
}
