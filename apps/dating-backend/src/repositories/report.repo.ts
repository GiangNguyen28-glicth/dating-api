import { InjectModel } from '@nestjs/mongoose';

import {
  CrudRepo,
  DATABASE_TYPE,
  PROVIDER_REPO,
  ReportModelType,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Report } from '@modules/report/entities';
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReportRepo extends CrudRepo<Report> {}
export class ReportMongoRepo extends MongoRepo<Report> {
  constructor(
    @InjectModel(Report.name)
    protected reportModel: ReportModelType,
  ) {
    super(reportModel);
  }
}

export const ReportMongoRepoProvider = {
  provide: PROVIDER_REPO.REPORT + DATABASE_TYPE.MONGO,
  useClass: ReportMongoRepo,
};
