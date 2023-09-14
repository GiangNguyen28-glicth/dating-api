import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AtStrategy, RtStrategy, GoogleStrategy } from '@common/strategies';
import { MailService } from '../mail';
import { UserService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, JwtService, UserService, MailService, GoogleStrategy, AtStrategy, RtStrategy],
})
export class AuthModule {}
