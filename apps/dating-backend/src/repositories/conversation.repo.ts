import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import {
  ConversationModelType,
  ConversationType,
  CrudRepo,
  DATABASE_TYPE,
  MessageStatus,
  PROVIDER_REPO,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';
import { Conversation } from '@modules/conversation/entities';
import { GroupDate } from '@modules/admin/dto';

export interface ConversationRepo extends CrudRepo<Conversation> {
  countByMessageStatus(receiverId: string): Promise<number>;
  enableSafeMode(userId: string, conversationId: string): Promise<void>;
  disableSafeMode(userId: string, conversationId: string): Promise<void>;
  statisticByRangeDate(filter, format: GroupDate): Promise<any>;
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

  async enableSafeMode(userId: string, conversationId: string): Promise<Conversation> {
    return await this.conversationModel.findOneAndUpdate(
      { _id: conversationId, type: ConversationType.MATCHED, members: { $elemMatch: { $eq: userId } } },
      { $addToSet: { enableSafeMode: userId } },
    );
  }

  async disableSafeMode(userId: string, conversationId: string): Promise<Conversation> {
    return await this.conversationModel.findOneAndUpdate(
      { _id: conversationId, type: ConversationType.MATCHED, members: { $elemMatch: { $eq: userId } } },
      { $pull: { enableSafeMode: userId } },
    );
  }

  async chartStatisticByRangeDate(filter, format: GroupDate): Promise<any> {
    return await this.conversationModel.aggregate([
      { $match: filter },
      {
        $addFields: {
          formattedDate: {
            $dateToString: { format: format, date: '$createdAt' },
          },
        },
      },
      {
        $group: {
          _id: {
            date: '$formattedDate',
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          date: '$_id.date',
          count: '$count',
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  }
}

export const ConversationMongoRepoProvider = {
  provide: PROVIDER_REPO.CONVERSATION + DATABASE_TYPE.MONGO,
  useClass: ConversationMongoRepo,
};
