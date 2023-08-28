import { Conversation } from '../entities/conversation.entity';

export class CreateConversationDto implements Partial<Conversation> {
  members?: string[];
}
