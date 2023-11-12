import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IJwtPayload } from '@modules/auth';
import { User } from '@modules/users/entities';
import { UserService } from '@modules/users/users.service';
import { AdminService } from '@modules/admin/admin.service';
@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private userService: UserService, private adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET,
    });
  }
  async validate(payload: IJwtPayload): Promise<User> {
    try {
      let user: User = null;
      if (!payload.role) {
        user = await this.userService.findOne({ _id: payload._id });
      } else {
        user = (await this.adminService.findOne({ _id: payload._id })) as any;
      }
      if (!user) {
        throw new UnauthorizedException('jwt not accepted');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}
