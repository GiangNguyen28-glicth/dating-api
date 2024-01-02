import { Gender, IResult, LANGUAGE, PaginationDTO, RegisterType } from '@dating/common';
import { NotFoundException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dayjs = require('dayjs');
import slugify from 'slugify';
import * as fs from 'fs';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

import { GroupDate, TYPE_RANGE } from '@modules/admin/dto';
import { GeoLocation, User } from '@modules/users/entities';
// import { data_tt } from './data';

export function toSlug(text: string, locale?: string): string {
  if (!text) return '';
  text = text.replace('$', '').replace('%', '');
  locale = locale ? locale : LANGUAGE.VI;
  return slugify(text, {
    replacement: '-',
    lower: true,
    strict: true,
    locale: locale,
    trim: true,
  });
}

export function toKeyword(str: string): string {
  str = str.toLowerCase();
  //     We can also use this instead of from line 11 to line 17
  //     str = str.replace(/\u00E0|\u00E1|\u1EA1|\u1EA3|\u00E3|\u00E2|\u1EA7|\u1EA5|\u1EAD|\u1EA9|\u1EAB|\u0103|\u1EB1|\u1EAF|\u1EB7|\u1EB3|\u1EB5/g, "a");
  //     str = str.replace(/\u00E8|\u00E9|\u1EB9|\u1EBB|\u1EBD|\u00EA|\u1EC1|\u1EBF|\u1EC7|\u1EC3|\u1EC5/g, "e");
  //     str = str.replace(/\u00EC|\u00ED|\u1ECB|\u1EC9|\u0129/g, "i");
  //     str = str.replace(/\u00F2|\u00F3|\u1ECD|\u1ECF|\u00F5|\u00F4|\u1ED3|\u1ED1|\u1ED9|\u1ED5|\u1ED7|\u01A1|\u1EDD|\u1EDB|\u1EE3|\u1EDF|\u1EE1/g, "o");
  //     str = str.replace(/\u00F9|\u00FA|\u1EE5|\u1EE7|\u0169|\u01B0|\u1EEB|\u1EE9|\u1EF1|\u1EED|\u1EEF/g, "u");
  //     str = str.replace(/\u1EF3|\u00FD|\u1EF5|\u1EF7|\u1EF9/g, "y");
  //     str = str.replace(/\u0111/g, "d");
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // Â, Ê, Ă, Ơ, Ư
  return str;
}

export function transformTextSearch(text: string): string {
  if (!text) return '';
  text = text.replace('$', '').replace('%', '');
  text = slugify(text, {
    replacement: '-',
    lower: true,
    strict: true,
    trim: true,
  });
  return text.replace(/-/g, ' ');
}

export function throwIfNotExists<T>(model: T | any, message: string) {
  if (!model || model?.isDeleted) {
    throw new NotFoundException(`${message}`);
  }
}

export function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

export function calSecondBetweenTwoDate(sendAt: Date): number {
  const now = new Date();
  const diffInSeconds = dayjs(now).diff(sendAt, 'second');
  return diffInSeconds;
}

export async function hash(value: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(value, salt);
  } catch (error) {
    throw error;
  }
}

export async function compareHashValue(value: string, hashValue: string): Promise<boolean> {
  const correct = await bcrypt.compare(value, hashValue);
  return correct ? true : false;
}

export function formatResult<T>(data: T[], totalCount: number, pagination?: PaginationDTO): IResult<T> {
  const results: IResult<T> = {
    results: data,
    pagination: {
      currentPage: pagination?.page,
      currentSize: pagination?.size,
      totalCount: totalCount,
    },
  };
  if (!pagination) {
    return results;
  }
  const totalPage = totalCount / pagination.size;
  results.pagination.totalPage = Math.floor(totalPage) + 1;
  if (totalPage % 1 === 0) {
    results.pagination.totalPage = totalPage;
  }
  if (pagination.page > 1) {
    results.pagination.prevPage = pagination.page - 1;
  } else {
    results.pagination.prevPage = null;
  }
  if (results.pagination.totalPage <= pagination.page) {
    results.pagination.nextPage = null;
  } else {
    results.pagination.nextPage = pagination.page + 1;
  }
  return results;
}

export function getPercentage(count: number, totalCount: number): number {
  if (totalCount < 0) {
    return 0;
  }
  return Number(((count / totalCount) * 100).toFixed(2));
}

export function docToObject<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

export async function downloadImage(url: string, image_name: string) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    // Ghi dữ liệu hình ảnh vào tệp'
    fs.writeFileSync(`E:/Nestjs/dating-api/apps/dating-backend/images/${image_name}.jpg`, response.data);
    console.log('Hình ảnh đã được tải xuống và lưu thành công.');
  } catch (error) {
    console.error('Lỗi khi tải xuống hình ảnh:', error);
    process.exit();
  }
}

export function getFormatGroupISODate(typeRange: TYPE_RANGE): GroupDate {
  switch (typeRange) {
    case TYPE_RANGE.MONTH:
      return '%Y-%m';
    case TYPE_RANGE.WEEK:
      return '%Y-%U';
    case TYPE_RANGE.DAY:
      return '%Y-%m-%d';
    case TYPE_RANGE.YEAR:
      return '%Y';
  }
}

export function mappingData(): User[] {
  const obj_2 = null;
  const results = obj_2.data.results;
  const users: User[] = [];
  results.map(item => {
    try {
      const user = new User();
      user.images = [];
      const date = new Date(item.user.birth_date);
      if (date.toString() === 'Invalid Date') {
        return;
      }
      user.birthDate = new Date(item.user.birth_date);
      item.user.photos.forEach(image => {
        user.images.push({ url: image.url });
      });
      user.bio = item.user.bio;
      user.name = item.user.name;
      if (item.user.gender === -1) {
        user.gender = Gender.FEMALE;
      } else {
        user.gender = Gender.MALE;
      }
      const p = new GeoLocation();
      p.type = 'Point';
      p.coordinates = [106.7350921, 10.7191672];
      user.geoLocation = p;
      if (item.user.jobs.length > 0) {
        user.company = item.user.jobs[0].company.name;
        user.jobs = [item.user.jobs[0].title.name];
      }
      if (item.user.schools.length > 0) {
        user.school = item.user.schools[0].name;
      }
      user.registerType = RegisterType.PHONE_NUMBER;
      users.push(user);
    } catch (error) {
      return;
    }
  });
  return users;
}
