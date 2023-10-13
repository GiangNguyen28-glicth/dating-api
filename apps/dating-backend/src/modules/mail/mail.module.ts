import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Global()
@Module({
  controllers: [MailController],
  providers: [MailService, JwtService],
  exports: [MailService],
})
export class MailModule {}
