import { InjectModel } from '@nestjs/mongoose';
import { CrudRepo, DATABASE_TYPE, MessageModelType, MessageStatus, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { SeenMessage } from '@modules/message/dto';
import { Message } from '@modules/message/entities';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MessageRepo extends CrudRepo<Message> {
  seenMessage(seenMessage: SeenMessage): void;
  receivedMessage(receiverId: string): void;
  updateMessageToReceived(ids: string[]): void;
}
export class MessageMongoRepo extends MongoRepo<Message> {
  constructor(@InjectModel(Message.name) protected messageModel: MessageModelType) {
    super(messageModel);
  }

  async seenMessage(seenMessage: SeenMessage): Promise<void> {
    const { conversation, seenAt } = seenMessage;
    await this.messageModel.updateMany(
      { conversation, status: MessageStatus.SENT, createdAt: { $lte: seenAt } },
      { $set: { status: MessageStatus.SEEN, seenAt } },
      { returnDocument: 'after', rawResult: true },
    );
  }

  async updateMessageToReceived(ids: string[]): Promise<void> {
    await this.messageModel.updateMany(
      { _id: { $in: ids }, status: MessageStatus.SENT },
      { $set: { status: MessageStatus.RECEIVED } },
    );
  }

  async receivedMessage(receiverId: string): Promise<void> {
    await this.messageModel.updateMany(
      { receiver: receiverId, status: { $ne: MessageStatus.RECEIVED } },
      { $set: { status: MessageStatus.RECEIVED } },
    );
  }
}

export const MessageMongoRepoProvider = {
  provide: PROVIDER_REPO.MESSAGE + DATABASE_TYPE.MONGO,
  useClass: MessageMongoRepo,
};
