import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { ConversationModelType, CrudRepo, DATABASE_TYPE, MessageStatus, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Conversation } from '@modules/conversation/entities';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConversationRepo extends CrudRepo<Conversation> {
  countByMessageStatus(receiverId: string): Promise<number>;
}
export class ConversationMongoRepo extends MongoRepo<Conversation> {
  constructor(
    @InjectModel(Conversation.name)
    protected conversationModel: ConversationModelType,
  ) {
    super(conversationModel);
  }

  async countByMessageStatus(receiverId: string): Promise<number> {
    const groups = await this.conversationModel.aggregate([
      {
        $match: {
          lastMessage: { $exists: true },
          members: { $elemMatch: { $eq: new Types.ObjectId(receiverId) } },
        },
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessage',
          foreignField: '_id',
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$status', MessageStatus.SEEN] },
                    { $eq: ['$receiver', new Types.ObjectId(receiverId)] },
                  ],
                },
              },
            },
          ],
          as: 'messages',
        },
      },
      { $match: { 'messages.0': { $exists: true } } },
    ]);
    return groups.length;
  }
}

export const ConversationMongoRepoProvider = {
  provide: PROVIDER_REPO.CONVERSATION + DATABASE_TYPE.MONGO,
  useClass: ConversationMongoRepo,
};
