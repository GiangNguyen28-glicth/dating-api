import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { ImageDTO } from '@modules/users/dto';
import { MessageStatus, MessageType } from '@common/consts';
import { CallMessage, Message } from '../entities';

export class CallMessageDTO implements Partial<CallMessage> {
  @ApiPropertyOptional()
  startTime?: Date;

  @ApiPropertyOptional()
  endTime?: Date;

  @ApiPropertyOptional()
  isMiss?: boolean;
}
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

  @ApiPropertyOptional({ type: CallMessageDTO })
  callMessage?: CallMessage;

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
