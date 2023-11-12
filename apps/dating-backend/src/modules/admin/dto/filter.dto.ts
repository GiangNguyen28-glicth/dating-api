import { TIME_ZONE } from '@common/consts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { get } from 'lodash';
import * as moment from 'moment-timezone';

export enum TYPE_RANGE {
  DAY = 'Day',
  WEEK = 'Week',
  MONTH = 'Month',
  YEAR = 'Year',
}

export type FormatBilling = '%Y-%U' | '%Y-%m' | '%Y-%m-%d';

export class FilterGetBillingStatistic {
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

  format?: FormatBilling;
}
