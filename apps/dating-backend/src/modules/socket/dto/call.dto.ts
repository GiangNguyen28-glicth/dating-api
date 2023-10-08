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
};

export type AnswerMessage = {
  roomId: string;
  offer: any;
};

export type AnswerMessageResponse = {
  offer: any;
};
