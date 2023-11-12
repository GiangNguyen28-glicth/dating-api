import { IJwtPayload, IRefreshPayload } from '@modules/auth';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_TOKEN_SECRET,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: IJwtPayload): IRefreshPayload {
    try {
      const refreshToken = req.get('authorization').replace('Bearer', '').trim();
      return {
        _id: payload._id,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }
}
