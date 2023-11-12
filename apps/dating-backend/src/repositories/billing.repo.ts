import { InjectModel } from '@nestjs/mongoose';

import { BillingModelType, CrudRepo, DATABASE_TYPE, PROVIDER_REPO } from '@dating/common';
import { MongoRepo } from '@dating/infra';

import { FormatBilling } from '@modules/admin/dto';
import { Billing } from '@modules/billing/entities';
export interface BillingRepo extends CrudRepo<Billing> {
  statisticRevenue(filter, format: FormatBilling): Promise<any[]>;
  topUsersByRevenue(filter, format: FormatBilling): Promise<any[]>;
}
export class BillingMongoRepo extends MongoRepo<Billing> {
  constructor(
    @InjectModel(Billing.name)
    protected billingModel: BillingModelType,
  ) {
    super(billingModel);
  }

  async statisticRevenue(filter, format: FormatBilling): Promise<any[]> {
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

  async topUsersByRevenue(filter, format: FormatBilling): Promise<any> {
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
        $lookup: {
          from: 'users', // Tên của bảng chứa thông tin người dùng
          localField: 'createdBy',
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
          formattedDate: 1,
          offeringType: 1,
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $group: {
          _id: {
            createdBy: '$userInfo',
            date: '$formattedDate',
            type: '$offeringType',
          },
          totalBilling: { $sum: '$latestPackage.price' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.date': 1,
        },
      },
      {
        $group: {
          _id: { date: '$_id.date', createdBy: '$_id.createdBy' },
          types: {
            $push: {
              type: '$_id.type',
              totalBilling: '$totalBilling',
              count: '$count',
            },
          },
        },
      },
      {
        $group: {
          _id: { month: '$_id.date' },
          users: { $push: { user: '$_id.createdBy', totalBilling: '$totalBilling', types: '$types' } },
        },
      },
      {
        $project: {
          _id: 1,
          users: 1,
        },
      },
    ]);
  }
}

export const BillingMongoRepoProvider = {
  provide: PROVIDER_REPO.BILLING + DATABASE_TYPE.MONGO,
  useClass: BillingMongoRepo,
};
