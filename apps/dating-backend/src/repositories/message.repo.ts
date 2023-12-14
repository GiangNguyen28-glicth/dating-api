import { InjectModel } from '@nestjs/mongoose';

import {
  CrudRepo,
  DATABASE_TYPE,
  MessageModelType,
  MessageStatus,
  MessageType,
  PROVIDER_REPO,
  PaginationDTO,
} from '@dating/common';
import { MongoRepo } from '@dating/infra';

import { SeenMessage } from '@modules/message/dto';
import { Message } from '@modules/message/entities';

export interface MessageRepo extends CrudRepo<Message> {
  seenMessage(seenMessage: SeenMessage): void;
  receivedMessage(receiverId: string): void;
  updateMessageToReceived(ids: string[]): void;
  getRatingByMessageCall(): any;
  getReviewsByMessageCall(filter, pagination: PaginationDTO): any;
}
export class MessageMongoRepo extends MongoRepo<Message> {
  constructor(@InjectModel(Message.name) protected messageModel: MessageModelType) {
    super(messageModel);
  }

  async seenMessage(seenMessage: SeenMessage): Promise<void> {
    const { conversation, seenAt } = seenMessage;
    await this.messageModel.updateMany(
      { conversation, status: { $ne: MessageStatus.SEEN }, createdAt: { $lte: seenAt } },
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

  async receivedMessage(receiver: string): Promise<void> {
    await this.messageModel.updateMany(
      { receiver, status: { $eq: MessageStatus.SENT } },
      { $set: { status: MessageStatus.RECEIVED } },
    );
  }

  async getRatingByMessageCall(): Promise<any> {
    return await this.messageModel.aggregate([
      { $match: { type: MessageType.CALL, reviews: { $gt: { $size: 1 } } } },
      { $unwind: '$reviews' },
      {
        $group: {
          _id: null,
          totalRating1: { $sum: { $cond: [{ $eq: ['$reviews.rating', 1] }, 1, 0] } },
          totalRating2: { $sum: { $cond: [{ $eq: ['$reviews.rating', 2] }, 1, 0] } },
          totalRating3: { $sum: { $cond: [{ $eq: ['$reviews.rating', 3] }, 1, 0] } },
          totalRating4: { $sum: { $cond: [{ $eq: ['$reviews.rating', 4] }, 1, 0] } },
          totalRating5: { $sum: { $cond: [{ $eq: ['$reviews.rating', 5] }, 1, 0] } },
          avgRating: { $avg: '$reviews.rating' },
          totalRating: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);
  }

  async getReviewsByMessageCall(filter, pagination: PaginationDTO): Promise<any> {
    return await this.messageModel.aggregate([
      { $match: filter },
      { $unwind: '$reviews' },
      {
        $project: {
          _id: 0,
          messageId: '$_id',
          rating: '$reviews.rating',
          content: '$reviews.content',
          createdBy: '$reviews.createdBy',
          createdAt: '$reviews.createdAt',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      { $unwind: '$createdBy' },
      {
        $project: {
          _id: 0,
          messageId: 1,
          rating: 1,
          content: 1,
          createdAt: 1,
          'createdBy._id': 1,
          'createdBy.name': 1,
          'createdBy.images': 1,
        },
      },
      {
        $skip: (pagination?.page - 1) * pagination?.size || 0,
      },
      {
        $limit: pagination?.size || 100,
      },
    ]);
  }
}

export const MessageMongoRepoProvider = {
  provide: PROVIDER_REPO.MESSAGE + DATABASE_TYPE.MONGO,
  useClass: MessageMongoRepo,
};
