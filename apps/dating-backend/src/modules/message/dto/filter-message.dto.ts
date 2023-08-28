import { ApiProperty } from '@nestjs/swagger';
import { FilterGetAll } from '@common/dto';
import { Message } from '../entities/message.entity';

export class FilterGetAllMessageDTO
  extends FilterGetAll
  implements Partial<Message>
{
  @ApiProperty()
  conversion?: string;
}
