import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail';
import { UsersModule } from '../users/users.module';
import { UserService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from '@common/strategies/google.strategies';
import { AtStrategy } from '@common/strategies/at.strategies';
import { RtStrategy } from '@common/strategies/jwt-rt.strategies';
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
