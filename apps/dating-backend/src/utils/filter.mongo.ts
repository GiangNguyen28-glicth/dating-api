import { SortOrder } from 'mongoose';
import { transformTextSearch } from './utils';
import { MongoQuery, SortQuery } from '@dating/common';
import { isNil } from 'lodash';
export class FilterBuilder<T> {
  private queryFilter: any = {
    $and: [],
  };

  private sortOption: SortQuery = {};

  setFilterItem(key: keyof T, query: MongoQuery, value: any, isNull = false) {
    if (!value && !isNull) return this;
    const subQuery = {
      [key]: { [query]: value },
    };
    this.queryFilter['$and'].push(subQuery);
    return this;
  }

  setFilterItemWithObject(key: string, query: any) {
    const subQuery = {
      [key]: query,
    };
    this.queryFilter['$and'].push(subQuery);
    return this;
  }

  addName(name: string) {
    name = name?.toLowerCase()?.trim();
    // If search text is empty, limit to using regex
    if (!name) return this;
    this.setFilterItemWithObject('keyword', {
      $regex: `${transformTextSearch(name)}`,
      $options: 'i',
    });
    return this;
  }

  setSortItem(key: keyof T, value: SortOrder) {
    if (!value) {
      return this;
    }
    this.sortOption[key as any] = value;
    return this;
  }

  buildQuery() {
    if (!this.queryFilter?.$and?.length) return [{}, this.sortOption];
    return [this.queryFilter, this.sortOption];
  }
}
