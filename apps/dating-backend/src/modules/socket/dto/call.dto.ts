import { Image } from '@modules/users/entities';

export type CheckRoomMessage = {
  roomId: string;
};

export type CheckRoomMessageResponse =
  | {
      status: false;
    }
  | { status: true; offer: any };

export type OfferMessage = {
  roomId: string;
  offer: any;
};

export type OfferMessageResponse = {
  roomId: string;
  onwner: {
    name: string;
    image: Image;
  };
};

export type RejectMessage = {
  status: boolean;
  roomId: string;
};

export type RejectMessageResponse = {
  status: boolean;
};

export type AnswerMessage = {
  roomId: string;
  offer: any;
};

export type AnswerMessageResponse = {
  offer: any;
};
