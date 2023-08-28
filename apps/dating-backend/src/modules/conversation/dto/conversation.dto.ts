import { FilterGetAll, FilterGetOne } from '@common/dto';
import { Conversation } from '../entities/conversation.entity';

export class FilterGetAllConversationDTO extends FilterGetAll {
  message?: number;
}

export class FilterGetOneConversationDTO
  extends FilterGetOne
  implements Partial<Conversation>
{
  members?: string[];
}
