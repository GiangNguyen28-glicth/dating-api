import { ConversationType } from '@common/consts';

import { User } from '@modules/users/entities';

import { Conversation } from '../entities';

export class CreateConversationDto implements Partial<Conversation> {
  members?: User[];
  type?: ConversationType;
}
