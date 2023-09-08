import { FilterGetOne } from '@common/dto';
import { Action } from '../entities/action.entity';

export class FilterGetOneActionDTO
  extends FilterGetOne
  implements Partial<Action>
{
  _id?: string;
  countLiked?: number;
  countUnLiked?: number;
  userId?: string;
}
