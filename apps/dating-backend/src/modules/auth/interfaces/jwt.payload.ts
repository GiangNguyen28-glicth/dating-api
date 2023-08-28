export interface IToken {
  accessToken: string;
  refreshToken: string;
}

export interface IRefreshPayload {
  _id: string;
  refreshToken: string;
}

export interface IJwtPayload {
  _id: string;
  email: string;
}
