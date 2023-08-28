import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@common/consts';
import { Message } from '../entities/message.entity';
export class CreateMessageDto implements Partial<Message> {
  @ApiProperty()
  receiver: string;

  @ApiPropertyOptional()
  text: string;

  @ApiPropertyOptional()
  urlImage?: string;

  @ApiProperty()
  type?: MessageType;

  @ApiProperty()
  conversion?: string;

  @ApiProperty()
  uuid: string;
}
