import { FilterGetAll, FilterGetOne } from '@common/dto';
import { MatchRequest } from '../entities/match-request.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class FilterGetOneMq
  extends FilterGetOne
  implements Partial<MatchRequest>
{
  owner?: string;
  requestBy?: string;
}
export class FilterGelAllMqDTO extends FilterGetAll {}
