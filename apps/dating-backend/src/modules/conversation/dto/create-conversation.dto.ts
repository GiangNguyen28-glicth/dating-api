import { ApiPropertyOptional } from '@nestjs/swagger';

import { ConversationType } from '@common/consts';

import { User } from '@modules/users/entities';

import { Conversation } from '../entities';

export class CreateConversationDto implements Partial<Conversation> {
  members?: User[];
  type?: ConversationType;
  createdBy?: string;
}

export class UpdateConversationDto implements Partial<Conversation> {
  @ApiPropertyOptional()
  enableSafeMode?: string[];
}
