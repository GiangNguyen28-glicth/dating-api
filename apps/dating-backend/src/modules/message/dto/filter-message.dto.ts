import { ApiProperty } from '@nestjs/swagger';
import { FilterGetAll } from '@common/dto';
import { Message } from '../entities/message.entity';
import { IsNotEmpty } from 'class-validator';

export class FilterGetAllMessageDTO
  extends FilterGetAll
  implements Partial<Message>
{
  @IsNotEmpty()
  @ApiProperty()
  conversation?: string;
}
