import { FilterGetAll, FilterGetOne } from '@common/dto';
import { MatchRequest } from '../entities';
import { MatchRqStatus } from '@common/consts';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterGetOneMq extends FilterGetOne implements Partial<MatchRequest> {
  sender?: string;
  receiver?: string;
  status?: MatchRqStatus;
}
export class FilterGelAllMqDTO extends FilterGetAll implements Partial<MatchRequest> {
  @ApiPropertyOptional({ type: 'enum', enum: MatchRqStatus })
  status?: MatchRqStatus;
}
