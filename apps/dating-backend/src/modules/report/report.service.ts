import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { ReportRepo } from '@dating/repositories';
import { DATABASE_TYPE, PROVIDER_REPO } from '@common/consts';
import { IResponse, IResult } from '@common/interfaces';
import { FilterBuilder, formatResult, throwIfNotExists } from '@dating/utils';
import { PaginationDTO } from '@common/dto';

import { ActionService } from '@modules/action/action.service';
import { UserService } from '@modules/users/users.service';

import { User } from '@modules/users/entities';

import { CreateReportDto, FilterGetAllReportDTO, UpdateReportDto } from './dto';
import { Report } from './entities';
import { Admin } from '@modules/admin/entities';

const LIMIT_IMAGES_REPORT = 5;
@Injectable()
export class ReportService {
  constructor(
    @Inject(PROVIDER_REPO.REPORT + DATABASE_TYPE.MONGO)
    private reportRepo: ReportRepo,

    private actionService: ActionService,

    private userService: UserService,
  ) {}
  async create(createReportDto: CreateReportDto, user: User): Promise<Report> {
    try {
      if (createReportDto?.images?.length > LIMIT_IMAGES_REPORT) {
        throw new BadRequestException(`Số lượng ảnh vượt quá ${LIMIT_IMAGES_REPORT}`);
      }
      createReportDto['reportBy'] = user._id;
      const report = await this.reportRepo.insert(createReportDto);
      await this.reportRepo.save(report);
      await this.actionService.skip(user, createReportDto.reportedUser);
      return report;
    } catch (error) {
      throw error;
    }
  }

  async findAll(filter: FilterGetAllReportDTO): Promise<IResult<Report>> {
    try {
      const [queryFilter, sortOption] = new FilterBuilder<Report>()
        .setFilterItem('isDeleted', '$eq', false, true)
        .setSortItem('createdAt', 'desc')
        .buildQuery();
      const pagination: PaginationDTO = {
        size: filter?.size,
        page: filter?.page,
      };
      const selectField: Array<keyof User> = ['_id', 'name', 'images'];
      const fields = selectField.join(' ');
      const [results, totalCount] = await Promise.all([
        this.reportRepo.findAll({
          queryFilter,
          pagination,
          sortOption,
          populate: [
            { path: 'reportBy', select: fields },
            { path: 'reportedUser', select: fields },
          ],
        }),
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

  async blockUser(userId: string, admin: Admin): Promise<IResponse> {
    try {
      const user = await this.userService.findOne({ _id: userId });
      throwIfNotExists(user, 'User không tồn tại');
      await this.reportRepo.updateManyByFilter(
        { reportedUser: userId, isVerified: false },
        { isVerified: true, blockAt: new Date(), confirmBy: admin },
      );
      await this.userService.findOneAndUpdate(userId, { isBlocked: true, blockedAt: new Date() });
      return {
        success: true,
        message: 'Ok',
      };
    } catch (error) {
      throw error;
    }
  }

  async unBlock(userId: string, admin: Admin): Promise<IResponse> {
    try {
      await this.userService.findOneAndUpdate(userId, { isBlocked: false, unBlockedAt: new Date() });
      return {
        success: true,
        message: 'Ok',
      };
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
