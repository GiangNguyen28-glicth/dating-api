import { PopulateOptions } from 'mongoose';
import { PaginationDTO } from '../dto';

export interface IOptionFilterGetAll<T> {
  pagination?: PaginationDTO;
  queryFilter?: Partial<T>;
  sortOption?: any;
  fields?: string[];
  populate?: PopulateOptions[];
}

export interface IOptionFilterGetOne<T> {
  queryFilter?: Partial<T>;
  fields?: string[];
  populate?: PopulateOptions[];
}

export interface CrudRepo<T> {
  findOne(filterQuery?: IOptionFilterGetOne<T>, fields?: string[]): Promise<T>;
  findAll(option?: IOptionFilterGetAll<T>): Promise<T[]>;
  count(filterQuery?: Partial<T>): Promise<number>;
  insert(entity: Partial<T>): Promise<T>;
  findOneAndUpdate(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<T>;
  deleteMany(ids: string[]): Promise<void>;
  insertMany(entities: T[]): Promise<void>;
  updateMany(ids: string[], entities: Partial<T>): Promise<void>;
  upsert(filterQuery: T, entities: T): Promise<T>;
  save(document): Promise<any>;
  distinct(field: keyof T, { queryFilter }?: IOptionFilterGetAll<T>): Promise<any[]>;
  toJSON(document): T;
}

export interface IEntity {
  _id?: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IResult<T> {
  results: T[];
  pagination: {
    totalCount?: number;
    currentPage?: number;
    currentSize?: number;
    totalPage?: number;
    nextPage?: number;
    prevPage?: number;
  };
  metadata?: any;
}

export interface ISocketIdsClient {
  sender: string[];
  receiver: string[];
}

export interface IErrorResponse {
  message?: string;
  data?: any;
}
