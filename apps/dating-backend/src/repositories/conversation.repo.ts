import { InjectModel } from '@nestjs/mongoose';
import {
  ConversationModelType,
  CrudRepo,
  DATABASE_TYPE,
  IOptionFilterGetAll,
  PROVIDER_REPO,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Conversation } from '@modules/conversation/entities/conversation.entity';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConversationRepo extends CrudRepo<Conversation> {
  updateEntities(entities);
  docToJSON(entities): Conversation;
}
export class ConversationMongoRepo extends MongoRepo<Conversation> {
  constructor(
    @InjectModel(Conversation.name)
    protected conversationModel: ConversationModelType,
  ) {
    super(conversationModel);
  }

  docToJSON(entities) {
    return this.toJSON(entities);
  }
}

export const ConversationMongoRepoProvider = {
  provide: PROVIDER_REPO.CONVERSATION + DATABASE_TYPE.MONGO,
  useClass: ConversationMongoRepo,
};
