import { CrudRepo, IOptionFilterGetAll } from '@dating/common';
import { Document, FilterQuery, Model, Types } from 'mongoose';

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

  async insert(document: Partial<T>): Promise<Document> {
    const createdDocument: Document = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return createdDocument;
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

  async distinct(field: string, { queryFilter }: IOptionFilterGetAll<T>) {
    if (!field) {
      throw new Error('Missing field in select distinct');
    }
    return await this.model.find(queryFilter).distinct(field);
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

  async updateMany(ids: string[], entities: Partial<T>): Promise<void> {
    await this.model.updateMany({ _id: { $in: ids } }, entities);
  }

  async updateEntities(entities: Partial<T>): Promise<T | Document> {
    const modelUpdated = new this.model(entities);
    return await modelUpdated.save();
  }
}
