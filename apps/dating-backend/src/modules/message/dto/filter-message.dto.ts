import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { FilterGetAll } from '@common/dto';
import { MessageStatus } from '@common/consts';

import { Message } from '../entities';

export class FilterGetAllMessageDTO extends FilterGetAll implements Partial<Message> {
  @IsNotEmpty()
  @ApiProperty()
  conversation?: string;

  receiver?: string;

  status?: MessageStatus;
}
