import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, Max, Min } from 'class-validator';
import { Message } from '../entities';
import { CreateMessageDto } from './create-message.dto';
export class UpdateMessageDto extends PartialType(CreateMessageDto) {}

export class ReviewCallDTO implements Partial<Message> {
  @ApiProperty()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  messageId: string;

  @ApiPropertyOptional()
  content?: string;
}
