import { InjectModel } from '@nestjs/mongoose';

import { BillingModelType, CrudRepo, DATABASE_TYPE, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';

import { GroupDate } from '@modules/admin/dto';
import { Billing } from '@modules/billing/entities';
export interface BillingRepo extends CrudRepo<Billing> {
  statisticRevenue(filter, format: GroupDate): Promise<any[]>;
  topUsersByRevenue(filter): Promise<any[]>;
}
export class BillingMongoRepo extends MongoRepo<Billing> {
  constructor(
    @InjectModel(Billing.name)
    protected billingModel: BillingModelType,
  ) {
    super(billingModel);
  }

  async statisticRevenue(filter, format: GroupDate): Promise<any[]> {
    return await this.billingModel.aggregate([
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
            offering: '$offering',
            date: '$formattedDate',
          },
          totalAmount: { $sum: '$latestPackage.price' },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  }

  async topUsersByRevenue(filter): Promise<any> {
    return await this.billingModel.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: {
            createdBy: '$createdBy',
            type: '$offeringType',
          },
          totalAmount: {
            $sum: '$latestPackage.price',
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $group: {
          _id: {
            createdBy: '$_id.createdBy',
          },
          types: {
            $push: {
              type: '$_id.type',
              totalAmount: '$totalAmount',
              count: '$count',
            },
          },
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.createdBy',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $project: {
          _id: 1,
          latestPackage: 1,
          'userInfo._id': 1,
          'userInfo.name': 1,
          'userInfo.images': 1,
          types: 1,
        },
      },
      {
        $unwind: {
          path: '$userInfo',
        },
      },
    ]);
  }
}

export const BillingMongoRepoProvider = {
  provide: PROVIDER_REPO.BILLING + DATABASE_TYPE.MONGO,
  useClass: BillingMongoRepo,
};
