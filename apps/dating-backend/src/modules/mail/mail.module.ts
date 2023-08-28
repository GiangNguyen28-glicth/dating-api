import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [MailController],
  providers: [MailService, JwtService],
  exports: [MailService],
})
export class MailModule {}
