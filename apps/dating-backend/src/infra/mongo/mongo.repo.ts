import { Document, FilterQuery, Model, PopulateOptions, Types } from 'mongoose';
import { CrudRepo, IOptionFilterGetAll } from '@dating/common';
import { GroupDate } from '@modules/admin/dto';

export abstract class MongoRepo<T> implements CrudRepo<T> {
  constructor(protected readonly model: Model<T>) {}

  async findAll(options: IOptionFilterGetAll<T>): Promise<T[]> {
    if (!options) {
      return await this.model.find().lean();
    }
    const { queryFilter, sortOption, fields, pagination, populate } = options;
    const result = await this.model
      .find(queryFilter)
      .populate(populate)
      .skip((pagination?.page - 1) * pagination?.size)
      .limit(pagination?.size)
      .sort(sortOption)
      .select(fields)
      .lean();
    return result as T[];
  }

  getModel() {
    return this.model;
  }

  async findOne(option: IOptionFilterGetAll<T>): Promise<T> {
    const { queryFilter, populate, fields } = option;
    const doc = await this.model.findOne(queryFilter).populate(populate).select(fields);
    return doc as T;
  }

  async count(filterQuery?: T): Promise<number> {
    return await this.model.countDocuments(filterQuery);
  }

  async insert(document: Partial<T>): Promise<T> {
    const createdDocument: Document = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return createdDocument as T;
  }

  async save(document: Document): Promise<Document> {
    return await document.save();
  }

  toJSON(doc: Document): T {
    return doc.toJSON();
  }

  async findOneAndUpdate(id: string, entity: Partial<T>): Promise<T> {
    return (await this.model.findOneAndUpdate({ _id: id }, entity, {
      lean: true,
      new: true,
    })) as T;
  }

  async distinct(field: keyof T, { queryFilter }: IOptionFilterGetAll<T>) {
    if (!field) {
      throw new Error('Missing field in select distinct');
    }
    return await this.model.find(queryFilter).distinct(field.toString());
  }

  async delete(id: string): Promise<T> {
    return await this.model.findOneAndRemove({ _id: id });
  }

  insertMany(entities: T[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async upsert(filterQuery: FilterQuery<T>, document: Partial<T>) {
    return this.model.findOneAndUpdate(filterQuery, document, {
      lean: true,
      upsert: true,
      new: true,
    }) as T;
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.model.deleteMany({ _id: { $in: ids } });
  }

  async updateMany(ids: string[], entities: Partial<T>): Promise<void> {
    await this.model.updateMany({ _id: { $in: ids } }, entities);
  }

  async updateEntities(entities: Partial<T>): Promise<T | Document> {
    const modelUpdated = new this.model(entities);
    return await modelUpdated.save();
  }

  async populate(document: Document, populate: PopulateOptions[]): Promise<T> {
    return document.populate(populate);
  }

  async statisticByRangeDate(filter, format: GroupDate): Promise<any> {
    return await this.model.aggregate([
      { $match: filter },
      {
        $addFields: {
          formattedDate: {
            $dateToString: { format, date: '$createdAt' },
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
