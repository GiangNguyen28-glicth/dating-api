import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { parse } from 'cookie';

@Injectable()
export class WsGuard extends AuthGuard('ws') {
  getRequest(context: ExecutionContext) {
    const ctx = context.switchToWs().getClient().handshake;
    const { accessToken } = parse(ctx.headers.cookie);

    return {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    };
  }
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw new WsException('UnauthorizedException');
    }
    return user;
  }
}
