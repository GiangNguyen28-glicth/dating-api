import { InjectModel } from '@nestjs/mongoose';

import { CrudRepo, DATABASE_TYPE, PROVIDER_REPO, ReportModelType } from '@dating/common';
import { MongoRepo } from '@dating/infra';

import { Report } from '@modules/report/entities';
export interface ReportRepo extends CrudRepo<Report> {
  updateManyByFilter(filter: Partial<Report>, update: Partial<Report>): Promise<void>;
}
export class ReportMongoRepo extends MongoRepo<Report> {
  constructor(
    @InjectModel(Report.name)
    protected reportModel: ReportModelType,
  ) {
    super(reportModel);
  }

  async updateManyByFilter(filter: Partial<Notification>, update: Partial<Report>): Promise<void> {
    await this.reportModel.updateMany(filter, update);
  }
}

export const ReportMongoRepoProvider = {
  provide: PROVIDER_REPO.REPORT + DATABASE_TYPE.MONGO,
  useClass: ReportMongoRepo,
};
