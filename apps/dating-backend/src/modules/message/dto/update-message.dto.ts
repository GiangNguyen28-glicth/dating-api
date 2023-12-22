import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, Max, Min } from 'class-validator';

import { User } from '@modules/users/entities';

import { ReviewCall } from '../entities';
import { CreateMessageDto } from './create-message.dto';
export class UpdateMessageDto extends PartialType(CreateMessageDto) {}

export class ReviewCallDTO implements Partial<ReviewCall> {
  @ApiProperty()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  messageId: string;

  @ApiPropertyOptional()
  content: string;

  createdBy: string | User;
  createdAt?: Date;
}
