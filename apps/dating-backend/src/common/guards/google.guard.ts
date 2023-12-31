import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Injectable()
export class GoogleGuard extends AuthGuard('google') {
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
    if (user.isBlocked) {
      throw new UnauthorizedException('Your account has been blocked');
    }
    return user;
  }
}
