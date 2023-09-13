import { InjectModel } from '@nestjs/mongoose';
import {
  CrudRepo,
  DATABASE_TYPE,
  PROVIDER_REPO,
  RelationshipModelType,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Relationship } from '@modules/relationship/entities';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RelationshipRepo extends CrudRepo<Relationship> {}
export class RelationshipMongoRepo extends MongoRepo<Relationship> {
  constructor(
    @InjectModel(Relationship.name)
    protected relationshipModel: RelationshipModelType,
  ) {
    super(relationshipModel);
  }
}

export const RelationshipMongoRepoProvider = {
  provide: PROVIDER_REPO.RELATIONSHIP + DATABASE_TYPE.MONGO,
  useClass: RelationshipMongoRepo,
};
