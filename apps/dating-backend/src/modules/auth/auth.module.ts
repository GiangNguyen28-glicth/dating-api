import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '@modules/users/users.service';
import { GoogleStrategy, AtStrategy, RtStrategy } from '@common/strategies';

import { MailService } from '../mail';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    UserService,
    MailService,
    GoogleStrategy,
    AtStrategy,
    RtStrategy,
  ],
})
export class AuthModule {}
