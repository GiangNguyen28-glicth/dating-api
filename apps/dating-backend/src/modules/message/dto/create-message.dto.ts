import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@common/consts';
import { Message } from '../entities/message.entity';
import { ImageDTO } from '@modules/users/dto';
import { User } from '@modules/users/entities';

export class CreateMessageDto implements Partial<Message> {
  @ApiProperty()
  receiver: User;

  @ApiPropertyOptional()
  text: string;

  @ApiPropertyOptional({ type: [String] })
  images?: ImageDTO[];

  @ApiProperty({ enum: MessageType })
  type?: MessageType;

  @ApiProperty()
  conversation?: string;

  @ApiProperty()
  uuid: string;
}
