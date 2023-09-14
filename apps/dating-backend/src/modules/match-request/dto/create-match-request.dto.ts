import { MatchRequest } from '../entities';

export class CreateMatchRequestDto implements Partial<MatchRequest> {
  sender?: string;
  receiver?: string;
  isBoosts?: boolean;
}
