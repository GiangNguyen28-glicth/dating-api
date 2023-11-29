import { ISocketIdsClient } from '@common/interfaces';

import { User } from '@modules/users/entities';
import { Notification } from '@modules/notification/entities';
import { MatchRequest } from '../entities';

export interface IMatchedAction {
  sender: User;
  receiver: User;
  socketIdsClient: ISocketIdsClient;
  matchRq?: MatchRequest;
  noti?: Notification;
}
