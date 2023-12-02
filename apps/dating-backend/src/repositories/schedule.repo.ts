import { InjectModel } from '@nestjs/mongoose';

import { CrudRepo, DATABASE_TYPE, PROVIDER_REPO, ScheduleModelType } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Schedule } from '@modules/schedule/entities';
import { GroupDate } from '@modules/admin/dto';

export interface ScheduleRepo extends CrudRepo<Schedule> {
  statisticByRangeDate(filter, format: GroupDate): Promise<any>;
}
export class ScheduleMongoRepo extends MongoRepo<Schedule> implements ScheduleRepo {
  constructor(@InjectModel(Schedule.name) scheduleModel: ScheduleModelType) {
    super(scheduleModel);
  }
}

// eslint-disable-next-line prettier/prettier
export const ScheduleMongoRepoProvider = {
  provide: PROVIDER_REPO.SCHEDULE + DATABASE_TYPE.MONGO,
  useClass: ScheduleMongoRepo,
};
