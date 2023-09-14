import { FilterGetAll, FilterGetOne } from '@common/dto';
import { MatchRequest } from '../entities/match-request.entity';

export class FilterGetOneMq
  extends FilterGetOne
  implements Partial<MatchRequest>
{
  sender?: string;
  receiver?: string;
}
export class FilterGelAllMqDTO extends FilterGetAll {}
