import { InjectModel } from '@nestjs/mongoose';

import { CrudRepo, DATABASE_TYPE, PROVIDER_REPO, ScheduleModelType } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Schedule } from '@modules/schedule/entities';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ScheduleRepo extends CrudRepo<Schedule> {}
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
