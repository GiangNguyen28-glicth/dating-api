import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AtStrategy, GoogleStrategy, RtStrategy } from '@common/strategies';
import { AdminModule } from '@modules/admin';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
@Module({
  imports: [AdminModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, GoogleStrategy, AtStrategy, RtStrategy],
})
export class AuthModule {}
