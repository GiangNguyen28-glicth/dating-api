import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImageDTO } from '@modules/users/dto';
import { MessageStatus, MessageType } from '@common/consts';
import { Message } from '../entities';
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

  @ApiProperty({ enum: MessageStatus })
  status?: MessageStatus;

  @ApiProperty()
  @IsNotEmpty()
  conversation?: string;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  uuid: string;
}

export class SeenMessage {
  conversation: string;
  seenAt: Date;
  messageID: string;
  sender: string;
  receiver: string;
}
