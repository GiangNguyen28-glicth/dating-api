import {
  CrudRepo,
  DATABASE_TYPE,
  MessageModelType,
  MessageStatus,
  PROVIDER_REPO,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { SeenMessage } from '@modules/message/dto';
import { Message } from '@modules/message/entities';
import { InjectModel } from '@nestjs/mongoose';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MessageRepo extends CrudRepo<Message> {
  seenMessage(seenMessage: SeenMessage);
}
export class MessageMongoRepo extends MongoRepo<Message> {
  constructor(
    @InjectModel(Message.name) protected messageModel: MessageModelType,
  ) {
    super(messageModel);
  }

  async seenMessage(seenMessage: SeenMessage): Promise<any> {
    const { conversation, seenAt } = seenMessage;
    return await this.messageModel.updateMany(
      { conversation, status: MessageStatus.SENT, createdAt: { $lte: seenAt } },
      { $set: { status: MessageStatus.SEEN, seenAt } },
      { returnDocument: 'after', rawResult: true },
    );
  }
}

export const MessageMongoRepoProvider = {
  provide: PROVIDER_REPO.MESSAGE + DATABASE_TYPE.MONGO,
  useClass: MessageMongoRepo,
};
