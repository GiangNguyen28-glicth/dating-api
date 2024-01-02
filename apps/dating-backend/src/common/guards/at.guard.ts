import { IErrorResponse } from '@common/interfaces';
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
      const objError: IErrorResponse = {
        message: `Tài khoản của bạn đã bị khóa !`,
        data: {
          isBlocked: true,
        },
      };
      throw new BadRequestException(objError);
    }
    if (user?.isDeleted) {
      throw new BadRequestException('Tài khoản của bạn đã bị xóa !');
    }
    return user;
  }
}
