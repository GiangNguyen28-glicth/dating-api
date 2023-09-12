import { Conversation } from '@modules/conversation';
import { MatchRequest } from '@modules/match-request/entities';
import { Message } from '@modules/message';

export interface INotificationResult {
  messsages: Message[];
  likes: MatchRequest[];
  matched: Conversation[];
}
