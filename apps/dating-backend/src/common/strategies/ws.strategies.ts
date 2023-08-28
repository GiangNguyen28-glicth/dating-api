import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IJwtPayload } from '@modules/auth/interfaces/jwt.payload';
import { User } from '@modules/users/entities/user.entity';
import { UserService } from '@modules/users/users.service';

@Injectable()
export class WsStrategy extends PassportStrategy(Strategy, 'ws') {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET,
    });
  }

  async validate(payload: IJwtPayload): Promise<User> {
    try {
      const user = await this.userService.findOne({ _id: payload._id });
      if (!user) {
        throw new UnauthorizedException('jwt not accepted');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}
