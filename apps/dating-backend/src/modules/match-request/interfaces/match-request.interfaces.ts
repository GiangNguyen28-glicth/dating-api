import { ISocketIdsClient } from '@common/interfaces';
import { MerchandisingType } from '@common/consts';

import { User } from '@modules/users/entities';
import { MatchRequest } from '../entities';

export interface IMatchedAction {
  sender: User;
  receiver: User;
  socketIdsClient: ISocketIdsClient;
  matchRq?: MatchRequest;
  action: MerchandisingType;
}
