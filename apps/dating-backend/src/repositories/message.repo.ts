import {
  CrudRepo,
  DATABASE_TYPE,
  MessageModelType,
  PROVIDER_REPO,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Message } from '@modules/message/entities/message.entity';
import { InjectModel } from '@nestjs/mongoose';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MessageRepo extends CrudRepo<Message> {}
export class MessageMongoRepo extends MongoRepo<Message> {
  constructor(
    @InjectModel(Message.name) protected messageModel: MessageModelType,
  ) {
    super(messageModel);
  }
}

export const MessageMongoRepoProvider = {
  provide: PROVIDER_REPO.MESSAGE + DATABASE_TYPE.MONGO,
  useClass: MessageMongoRepo,
};
