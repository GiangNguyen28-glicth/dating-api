import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { Admin } from '@modules/admin/entities';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler());
    if (!roles) {
      return true;
    }
    const request = ctx.switchToHttp().getRequest();
    const admin: Admin = request.user;
    if (!roles.some(role => admin?.role === role)) {
      throw new ForbiddenException('Forbidden resource');
    }
    return true;
  }
}
