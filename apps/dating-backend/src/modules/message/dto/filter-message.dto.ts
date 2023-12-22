import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { FilterGetAll, PaginationDTO } from '@common/dto';
import { MessageStatus } from '@common/consts';

import { Message, ReviewCall } from '../entities';

export class FilterGetAllMessageDTO extends FilterGetAll implements Partial<Message> {
  @IsNotEmpty()
  @ApiProperty()
  conversation?: string;

  receiver?: string;

  status?: MessageStatus;
}

export enum SORT_REVIEW {
  RECENT = 'Recent',
  HIGH_TO_LOW = 'High to low',
  LOW_TO_HIGH = 'Low to high',
}

export class FilterGetAllMessageReviews extends PaginationDTO implements Partial<ReviewCall> {
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({ type: 'enum', enum: SORT_REVIEW })
  sort?: SORT_REVIEW;
}
