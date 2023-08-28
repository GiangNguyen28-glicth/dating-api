import {
  CrudRepo,
  DATABASE_TYPE,
  PROVIDER_REPO,
  TagModelType,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Tag } from '@modules/tag/entities/tag.entity';
import { InjectModel } from '@nestjs/mongoose';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TagRepo extends CrudRepo<Tag> {}
export class TagMongoRepo extends MongoRepo<Tag> implements TagRepo {
  constructor(@InjectModel(Tag.name) tagModel: TagModelType) {
    super(tagModel);
  }
}

// eslint-disable-next-line prettier/prettier
export const TagMongoRepoProvider = {
  provide: PROVIDER_REPO.TAG + DATABASE_TYPE.MONGO,
  useClass: TagMongoRepo,
};
