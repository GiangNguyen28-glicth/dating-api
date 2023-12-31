import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { get } from 'lodash';
import * as moment from 'moment-timezone';

import { TIME_ZONE } from '@common/consts';

export enum TYPE_RANGE {
  DAY = 'Day',
  WEEK = 'Week',
  MONTH = 'Month',
  YEAR = 'Year',
}

export type GroupDate = '%Y-%U' | '%Y-%m' | '%Y-%m-%d' | '%Y';

export class FilterGetStatistic {
  @ApiPropertyOptional()
  @Transform(data => {
    return moment(get(data, 'value')).tz(TIME_ZONE).startOf('day').toDate();
  })
  fromDate?: Date = moment().tz(TIME_ZONE).startOf('day').toDate();

  @ApiPropertyOptional()
  @Transform(data => {
    return moment(get(data, 'value')).tz(TIME_ZONE).endOf('day').toDate();
  })
  toDate?: Date = moment().tz(TIME_ZONE).endOf('day').toDate();

  @ApiProperty({ enum: TYPE_RANGE, type: 'enum' })
  typeRange: TYPE_RANGE;

  format?: GroupDate;
}
