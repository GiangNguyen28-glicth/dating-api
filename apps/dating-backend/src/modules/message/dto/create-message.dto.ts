import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@common/consts';
import { Message } from '../entities/message.entity';
import { ImageDTO } from '@modules/users/dto';
import { IsNotEmpty } from 'class-validator';

export class CreateMessageDto implements Partial<Message> {
  @IsNotEmpty()
  @ApiProperty()
  receiver: string;

  @ApiPropertyOptional()
  text: string;

  @ApiPropertyOptional({ type: [ImageDTO] })
  images?: ImageDTO[];

  @ApiProperty({ enum: MessageType })
  type?: MessageType;

  @ApiProperty()
  @IsNotEmpty()
  conversation?: string;

  @ApiProperty()
  uuid: string;
}

export class SeenMessage {
  conversation: string;
  seenAt: Date;
  messageID: string;
  sender: string;
}
