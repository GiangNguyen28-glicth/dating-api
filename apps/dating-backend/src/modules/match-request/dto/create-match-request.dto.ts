import { MatchRequest } from '../entities/match-request.entity';

export class CreateMatchRequestDto implements Partial<MatchRequest> {
  requestBy: string;
  owner: string;
  isBoosts?: boolean;
}
