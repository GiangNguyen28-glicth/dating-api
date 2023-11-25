import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { User } from '@modules/users/entities';
@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (!info) {
        throw new UnauthorizedException(err);
      }
      throw new UnauthorizedException(err);
    }
    User.validateAccount(user);
    return user;
  }
}
