import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsGuard extends AuthGuard('ws') {
  getRequest(context: ExecutionContext) {
    const ctx = context.switchToWs().getClient().handshake;
    const accessToken = ctx.auth.token;
    if (!accessToken) {
      throw new WsException('UnauthorizedException');
    }
    ctx.headers['authorization'] = `Bearer ${accessToken}`;
    return ctx;
  }
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw new WsException('UnauthorizedException');
    }
    return user;
  }
}
