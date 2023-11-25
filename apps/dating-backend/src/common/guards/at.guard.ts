import { BadRequestException, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

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
    if (user?.isBlocked) {
      throw new BadRequestException('Tài khoản của bạn đã bị khóa !');
    }
    if (user?.isDeleted) {
      throw new BadRequestException('Tài khoản của bạn đã bị xóa !');
    }
    return user;
  }
}
